import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp, { type Metadata } from "sharp";
import prettier from "prettier";

import {
  productImageMapping,
  type ImageMappingConfidence,
  type ProductImageMapping,
} from "../src/data/image-mapping";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceDirectory = resolveSourceDirectory();
const publicDirectory = resolve(projectRoot, "public");
const docsDirectory = resolve(projectRoot, "docs");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

type AuditRow = {
  originalFilename: string;
  extension: string;
  detectedFormat: string;
  pixelWidth: number;
  pixelHeight: number;
  fileSizeBytes: number;
  inferredCollection: string;
  inferredProductName: string;
  inferredModelNumber: string;
  inferredFinish: string;
  mappedProductFamilyId: string;
  mappedVariantId: string;
  normalizedDestinationPath: string;
  confidence: ImageMappingConfidence;
  validationNote: string;
};

type ImportCounts = {
  mapped: number;
  skipped: number;
  inactive: number;
  ambiguous: number;
  missing: number;
  unmapped: number;
};

async function main() {
  validateManifestCollisions();
  await mkdir(docsDirectory, { recursive: true });

  const sourceFiles = (await readdir(sourceDirectory, { recursive: true }))
    .map((filename) => filename.replaceAll("\\", "/"))
    .filter((filename) => imageExtensions.has(extname(filename).toLowerCase()))
    .sort(new Intl.Collator("ko", { numeric: true }).compare);
  const sourceFileSet = new Set(
    sourceFiles.map((filename) => filename.normalize("NFC")),
  );
  const mappingByFilename = new Map(
    productImageMapping.map((mapping) => [
      mapping.originalFilename.normalize("NFC"),
      mapping,
    ]),
  );
  const counts: ImportCounts = {
    mapped: 0,
    skipped: 0,
    inactive: 0,
    ambiguous: 0,
    missing: 0,
    unmapped: 0,
  };
  const auditRows: AuditRow[] = [];
  const sourceHashes = new Map<string, string[]>();
  const errors: string[] = [];

  for (const filename of sourceFiles) {
    const normalizedFilename = filename.normalize("NFC");
    const sourcePath = resolve(sourceDirectory, filename);
    const mapping = mappingByFilename.get(normalizedFilename);
    const [metadata, fileStats, sourceBuffer] = await Promise.all([
      sharp(sourcePath).metadata(),
      stat(sourcePath),
      readFile(sourcePath),
    ]);
    const sourceHash = sha256(sourceBuffer);
    sourceHashes.set(sourceHash, [
      ...(sourceHashes.get(sourceHash) ?? []),
      filename,
    ]);

    if (!mapping) {
      counts.unmapped += 1;
      auditRows.push(
        makeAuditRow(filename, metadata, fileStats.size, undefined),
      );
      continue;
    }

    if (mapping.confidence === "ambiguous") counts.ambiguous += 1;
    if (!mapping.useInCatalog) {
      counts.inactive += 1;
      auditRows.push(makeAuditRow(filename, metadata, fileStats.size, mapping));
      continue;
    }

    const destinationPath = resolve(
      publicDirectory,
      mapping.normalizedPath.replace(/^\//, ""),
    );
    await mkdir(resolve(destinationPath, ".."), { recursive: true });

    const outputBuffer = await createOutputBuffer(
      sourcePath,
      sourceBuffer,
      metadata,
      destinationPath,
      mapping,
    );
    const destinationResult = await writeWithoutConflict(
      destinationPath,
      outputBuffer,
    );

    if (destinationResult === "mapped") counts.mapped += 1;
    else if (destinationResult === "skipped") counts.skipped += 1;
    else errors.push(destinationResult);

    auditRows.push(makeAuditRow(filename, metadata, fileStats.size, mapping));
  }

  for (const mapping of productImageMapping) {
    if (!sourceFileSet.has(mapping.originalFilename.normalize("NFC"))) {
      counts.missing += 1;
      errors.push(`원본 누락: ${mapping.originalFilename}`);
    }
  }

  const duplicateGroups = [...sourceHashes.values()].filter(
    (filenames) => filenames.length > 1,
  );
  await writeAuditReports(auditRows, counts, duplicateGroups);
  printSummary(counts, duplicateGroups, errors);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

function resolveSourceDirectory() {
  const sourceFlagIndex = process.argv.indexOf("--source");
  const sourceArgument =
    sourceFlagIndex >= 0 ? process.argv[sourceFlagIndex + 1] : undefined;
  const inlineSource = process.argv
    .find((argument) => argument.startsWith("--source="))
    ?.slice("--source=".length);
  return resolve(
    projectRoot,
    sourceArgument ?? inlineSource ?? "assets/images/products/originals",
  );
}

function validateManifestCollisions() {
  const destinations = new Map<string, string>();
  const variants = new Map<string, string>();

  for (const mapping of productImageMapping) {
    const destinationKey = mapping.normalizedPath.toLowerCase();
    const destinationSource = destinations.get(destinationKey);
    if (
      destinationSource &&
      destinationSource !== mapping.originalFilename.normalize("NFC")
    ) {
      throw new Error(
        `대상 충돌: ${destinationSource}와 ${mapping.originalFilename}가 ${mapping.normalizedPath}에 매핑됨`,
      );
    }
    destinations.set(destinationKey, mapping.originalFilename.normalize("NFC"));

    const variantSource = variants.get(mapping.variantId);
    if (variantSource && variantSource !== mapping.originalFilename) {
      throw new Error(
        `변형 충돌: ${variantSource}와 ${mapping.originalFilename}가 ${mapping.variantId}에 매핑됨`,
      );
    }
    variants.set(mapping.variantId, mapping.originalFilename);
  }
}

async function createOutputBuffer(
  sourcePath: string,
  sourceBuffer: Buffer,
  metadata: Metadata,
  destinationPath: string,
  mapping: ProductImageMapping,
) {
  const destinationExtension = extname(destinationPath).toLowerCase();
  const detectedExtension =
    metadata.format === "jpeg" ? ".jpg" : `.${metadata.format ?? ""}`;
  const requiresOrientation = (metadata.orientation ?? 1) !== 1;
  const requiresFormatChange = destinationExtension !== detectedExtension;
  const removesEmbeddedLabel =
    mapping.useInCatalog && mapping.collection === "HG 시리즈";

  if (!requiresOrientation && !requiresFormatChange && !removesEmbeddedLabel) {
    return sourceBuffer;
  }

  let pipeline = sharp(sourcePath).rotate();
  if (removesEmbeddedLabel) {
    const labelRows = await findEmbeddedLabelRows(sourcePath, metadata);
    if (!labelRows) {
      throw new Error(
        `이미지 내 모델명 영역을 찾을 수 없음: ${mapping.originalFilename}`,
      );
    }
    const [top, bottom] = labelRows;
    const cleanup = Buffer.from(
      `<svg width="${metadata.width}" height="${metadata.height}"><rect x="0" y="${top}" width="${metadata.width}" height="${bottom - top}" fill="#fff"/></svg>`,
    );
    pipeline = pipeline.composite([{ input: cleanup }]).withMetadata();
  }

  if (destinationExtension === ".jpg" || destinationExtension === ".jpeg") {
    pipeline = pipeline.jpeg({
      quality: removesEmbeddedLabel ? 100 : 95,
      chromaSubsampling: "4:4:4",
    });
  } else if (destinationExtension === ".png") {
    pipeline = pipeline.png({ compressionLevel: removesEmbeddedLabel ? 9 : 6 });
  } else if (destinationExtension === ".webp") {
    pipeline = pipeline.webp({ quality: 95 });
  } else {
    throw new Error(`지원하지 않는 출력 확장자: ${destinationExtension}`);
  }

  return pipeline.toBuffer();
}

async function findEmbeddedLabelRows(
  sourcePath: string,
  metadata: Metadata,
): Promise<[number, number] | undefined> {
  const { data, info } = await sharp(sourcePath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const searchStart = Math.floor(info.height * 0.85);
  const activeRows: boolean[] = [];
  for (let y = searchStart; y < info.height; y += 1) {
    let darkPixels = 0;
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (
        data[offset] < 235 ||
        data[offset + 1] < 235 ||
        data[offset + 2] < 235
      )
        darkPixels += 1;
    }
    activeRows.push(darkPixels >= 2);
  }

  const runs: Array<[number, number]> = [];
  let start: number | undefined;
  for (let index = 0; index <= activeRows.length; index += 1) {
    if (activeRows[index] && start === undefined) start = index;
    if (!activeRows[index] && start !== undefined) {
      if (index - start >= 2)
        runs.push([searchStart + start, searchStart + index - 1]);
      start = undefined;
    }
  }
  if (runs.length === 0) return undefined;
  return [
    Math.max(0, runs[0][0] - 5),
    Math.min(metadata.height ?? info.height, runs.at(-1)![1] + 6),
  ];
}

async function writeWithoutConflict(
  destinationPath: string,
  outputBuffer: Buffer,
): Promise<"mapped" | "skipped" | string> {
  try {
    const existingBuffer = await readFile(destinationPath);
    if (sha256(existingBuffer) === sha256(outputBuffer)) return "skipped";
    return `대상 파일 충돌(덮어쓰지 않음): ${destinationPath}`;
  } catch (error) {
    if (!isMissingFileError(error)) throw error;
  }

  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  try {
    await writeFile(temporaryPath, outputBuffer, { flag: "wx" });
    await rename(temporaryPath, destinationPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
  return "mapped";
}

function makeAuditRow(
  filename: string,
  metadata: Metadata,
  fileSizeBytes: number,
  mapping?: ProductImageMapping,
): AuditRow {
  return {
    originalFilename: filename,
    extension: extname(filename).toLowerCase(),
    detectedFormat: metadata.format ?? "unknown",
    pixelWidth: metadata.width ?? 0,
    pixelHeight: metadata.height ?? 0,
    fileSizeBytes,
    inferredCollection: mapping?.collection ?? "",
    inferredProductName: mapping?.inferredProductName ?? "",
    inferredModelNumber: mapping?.inferredModelNumber ?? "",
    inferredFinish: mapping?.inferredFinish ?? "",
    mappedProductFamilyId: mapping?.productId ?? "",
    mappedVariantId: mapping?.variantId ?? "",
    normalizedDestinationPath: mapping?.normalizedPath ?? "",
    confidence: mapping?.confidence ?? "unmapped",
    validationNote:
      mapping?.validationNote ??
      "매핑 규칙에 없는 이미지. 제품 및 변형 확인 필요.",
  };
}

async function writeAuditReports(
  rows: AuditRow[],
  counts: ImportCounts,
  duplicateGroups: string[][],
) {
  const csvHeader = [
    "original_filename",
    "extension",
    "detected_format",
    "pixel_width",
    "pixel_height",
    "file_size_bytes",
    "inferred_collection",
    "inferred_product_name",
    "inferred_model_number",
    "inferred_finish",
    "mapped_product_family_id",
    "mapped_variant_id",
    "normalized_destination_path",
    "confidence",
    "validation_note",
  ];
  const csvRows = rows.map((row) =>
    [
      row.originalFilename,
      row.extension,
      row.detectedFormat,
      row.pixelWidth,
      row.pixelHeight,
      row.fileSizeBytes,
      row.inferredCollection,
      row.inferredProductName,
      row.inferredModelNumber,
      row.inferredFinish,
      row.mappedProductFamilyId,
      row.mappedVariantId,
      row.normalizedDestinationPath,
      row.confidence,
      row.validationNote,
    ]
      .map(csvCell)
      .join(","),
  );
  await writeFile(
    resolve(docsDirectory, "catalog-image-audit.csv"),
    `${csvHeader.join(",")}\n${csvRows.join("\n")}\n`,
  );

  const confidenceCounts = rows.reduce<Record<ImageMappingConfidence, number>>(
    (result, row) => {
      result[row.confidence] += 1;
      return result;
    },
    {
      "confirmed-from-filename": 0,
      probable: 0,
      ambiguous: 0,
      unmapped: 0,
    },
  );
  const markdown = `# 카탈로그 이미지 감사

이 문서는 \`npm run import:images\` 실행 시 실제 소스 파일을 기준으로 다시 생성됩니다.
원본 디렉터리는 \`${relative(projectRoot, sourceDirectory) || "."}/\`이며 가져오기 과정에서 원본을 수정하거나 이동하지 않습니다.

## 요약

- 발견한 원본 이미지: ${rows.length}개
- 새로 복사한 이미지: ${counts.mapped}개
- 동일하여 건너뛴 이미지: ${counts.skipped}개
- 비활성 매핑으로 복사하지 않은 이미지: ${counts.inactive}개
- confirmed-from-filename: ${confidenceCounts["confirmed-from-filename"]}개
- probable: ${confidenceCounts.probable}개
- ambiguous: ${confidenceCounts.ambiguous}개
- unmapped: ${confidenceCounts.unmapped}개
- 매니페스트 기준 누락: ${counts.missing}개

신뢰도는 사업 확인 상태가 아니라 파일명과 이미지로 판단한 매핑 확실성을 뜻합니다.
\`confirmed-from-filename\`도 사업자가 검증했다는 뜻은 아닙니다.

## 파일 형식 및 크기

| 원본 파일 | 픽셀 | 형식 | 크기 | 매핑 신뢰도 | 대상 |
| --- | ---: | --- | ---: | --- | --- |
${rows
  .map(
    (row) =>
      `| ${escapeMarkdown(row.originalFilename)} | ${row.pixelWidth}×${row.pixelHeight} | ${row.extension} / ${row.detectedFormat} | ${formatBytes(row.fileSizeBytes)} | ${row.confidence} | ${row.normalizedDestinationPath || "미매핑"} |`,
  )
  .join("\n")}

## 완전히 동일한 원본

${
  duplicateGroups.length > 0
    ? duplicateGroups
        .map(
          (filenames) =>
            `- ${filenames.map((filename) => `\`${filename}\``).join(" = ")}`,
        )
        .join("\n")
    : "- 없음"
}

동일 파일이라도 서로 다른 제품명으로 제공된 경우 파일명대로 연결했으며 제품 관계를 변경하지 않았습니다.
출시 전 공급 자산이 올바른지 사업 확인이 필요합니다.

## 처리 정책

- EXIF 방향값이 있는 경우에만 자동 회전합니다.
- 방향과 실제 형식이 정상인 파일은 재인코딩하지 않고 바이트 그대로 복사합니다.
- 확장자와 실제 형식이 다른 파일은 감지된 형식과 일치하는 ASCII 대상 확장자를 사용합니다.
- 업스케일, 공격적 압축, 그림자, 배경 합성, 제품 형상 변경은 하지 않습니다.
- 기존 대상과 내용이 다르면 덮어쓰지 않고 충돌로 실패합니다.
`;
  const markdownPath = resolve(docsDirectory, "catalog-image-audit.md");
  const formattedMarkdown = await prettier.format(markdown, {
    filepath: markdownPath,
  });
  await writeFile(markdownPath, formattedMarkdown);
}

function printSummary(
  counts: ImportCounts,
  duplicateGroups: string[][],
  errors: string[],
) {
  console.log(`mapped: ${counts.mapped}`);
  console.log(`skipped: ${counts.skipped}`);
  console.log(`inactive: ${counts.inactive}`);
  console.log(`ambiguous: ${counts.ambiguous}`);
  console.log(`unmapped: ${counts.unmapped}`);
  console.log(`missing: ${counts.missing}`);
  console.log(`duplicate source groups: ${duplicateGroups.length}`);
  for (const error of errors) console.error(error);
}

function csvCell(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeMarkdown(value: string) {
  return value.replaceAll("|", "\\|");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sha256(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

void main();
