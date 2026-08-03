import { createHash } from "node:crypto";
import { access, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

import {
  brandIdentitySchema,
  catalogConfirmationKeys,
  catalogCorrectionSchema,
  companyInformationSchema,
  customerPolicySchema,
  launchDataSchema,
  legalInformationSchema,
  naverLinkRecordSchema,
  onlinePresenceSchema,
  productLaunchRecordSchema,
  seoIdentitySchema,
  siteReleaseModeSchema,
  type LaunchData,
} from "../../src/config/launch-schema";

export const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const launchDirectory = resolve(projectRoot, "data/launch");
export const activeLaunchDataPath = resolve(
  launchDirectory,
  "launch-data.json",
);

const sourceFiles = {
  business: resolve(launchDirectory, "business.yaml"),
  products: resolve(launchDirectory, "products.csv"),
  naverLinks: resolve(launchDirectory, "naver-links.csv"),
  confirmations: resolve(launchDirectory, "catalog-confirmations.yaml"),
  seo: resolve(launchDirectory, "seo.yaml"),
} as const;

const businessSourceSchema = z
  .object({
    brand: brandIdentitySchema,
    company: companyInformationSchema,
    online: onlinePresenceSchema.omit({
      productionDomain: true,
      canonicalBaseUrl: true,
    }),
    customerPolicy: customerPolicySchema,
    legal: legalInformationSchema,
    deployment: z
      .object({
        releaseMode: siteReleaseModeSchema,
      })
      .strict(),
  })
  .strict();

const seoSourceSchema = seoIdentitySchema
  .extend({
    productionDomain: z.string(),
    canonicalOrigin: z.string(),
  })
  .strict();

const confirmationsSourceSchema = z
  .object({
    confirmations: z
      .object(
        Object.fromEntries(
          catalogConfirmationKeys.map((key) => [
            key,
            launchDataSchema.shape.catalogConfirmations.shape[key],
          ]),
        ) as {
          [
            Key in (typeof catalogConfirmationKeys)[number]
          ]: (typeof launchDataSchema.shape.catalogConfirmations.shape)[Key];
        },
      )
      .strict(),
    catalogCorrections: z.array(catalogCorrectionSchema),
  })
  .strict();

export async function loadLaunchSourceData(): Promise<LaunchData | null> {
  const availability = await Promise.all(
    Object.entries(sourceFiles).map(async ([key, path]) => ({
      key,
      path,
      exists: await fileExists(path),
    })),
  );
  const present = availability.filter((file) => file.exists);
  if (present.length === 0) return null;

  const missing = availability.filter((file) => !file.exists);
  if (missing.length > 0) {
    throw new Error(
      [
        "Launch-data import is incomplete. Copy every template to its non-template filename.",
        ...missing.map((file) => `- missing ${relativeLaunchPath(file.path)}`),
      ].join("\n"),
    );
  }

  const [
    businessText,
    productsText,
    naverLinksText,
    confirmationsText,
    seoText,
  ] = await Promise.all([
    readFile(sourceFiles.business, "utf8"),
    readFile(sourceFiles.products, "utf8"),
    readFile(sourceFiles.naverLinks, "utf8"),
    readFile(sourceFiles.confirmations, "utf8"),
    readFile(sourceFiles.seo, "utf8"),
  ]);

  const business = parseWithSchema(
    businessSourceSchema,
    parseYamlFile(businessText, sourceFiles.business),
    sourceFiles.business,
  );
  const seoSource = parseWithSchema(
    seoSourceSchema,
    parseYamlFile(seoText, sourceFiles.seo),
    sourceFiles.seo,
  );
  const { productionDomain, canonicalOrigin, ...seo } = seoSource;
  const confirmationSource = parseWithSchema(
    confirmationsSourceSchema,
    parseYamlFile(confirmationsText, sourceFiles.confirmations),
    sourceFiles.confirmations,
  );
  const products = parseProductCsv(productsText);
  const naverLinks = parseNaverCsv(naverLinksText);
  const sourceHash = createHash("sha256")
    .update(
      [
        businessText,
        productsText,
        naverLinksText,
        confirmationsText,
        seoText,
      ].join("\n---launch-source-boundary---\n"),
    )
    .digest("hex");

  return parseWithSchema(
    launchDataSchema,
    {
      schemaVersion: 1,
      sourceHash,
      ...business,
      online: {
        ...business.online,
        productionDomain,
        canonicalBaseUrl: canonicalOrigin,
      },
      seo,
      products,
      naverLinks,
      catalogConfirmations: confirmationSource.confirmations,
      catalogCorrections: confirmationSource.catalogCorrections,
    },
    activeLaunchDataPath,
  );
}

export async function readActiveLaunchData() {
  const text = await readFile(activeLaunchDataPath, "utf8");
  return parseWithSchema(
    launchDataSchema,
    JSON.parse(text) as unknown,
    activeLaunchDataPath,
  );
}

export async function writeActiveLaunchData(data: LaunchData) {
  const nextText = `${JSON.stringify(data, null, 2)}\n`;
  const currentText = await readFile(activeLaunchDataPath, "utf8").catch(
    () => "",
  );
  if (currentText === nextText) return "unchanged" as const;

  const temporaryPath = `${activeLaunchDataPath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, nextText, { flag: "wx" });
  await rename(temporaryPath, activeLaunchDataPath);
  return "updated" as const;
}

function parseProductCsv(text: string) {
  const rows = parseCsv(text, sourceFiles.products);
  return rows.map((row, index) =>
    parseWithSchema(
      productLaunchRecordSchema,
      {
        ...row,
        available: parseBoolean(
          row.available,
          sourceFiles.products,
          index + 2,
          "available",
        ),
        customerVisible: parseBoolean(
          row.customerVisible,
          sourceFiles.products,
          index + 2,
          "customerVisible",
        ),
        documentPaths: splitList(row.documentPaths),
      },
      `${sourceFiles.products}:${index + 2}`,
    ),
  );
}

function parseNaverCsv(text: string) {
  const rows = parseCsv(text, sourceFiles.naverLinks);
  return rows.map((row, index) =>
    parseWithSchema(
      naverLinkRecordSchema,
      row,
      `${sourceFiles.naverLinks}:${index + 2}`,
    ),
  );
}

function parseYamlFile(text: string, path: string) {
  try {
    return parseYaml(text) as unknown;
  } catch (error) {
    throw new Error(
      `${relativeLaunchPath(path)}: invalid YAML: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function parseWithSchema<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
  path: string,
): z.output<Schema> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issues = result.error.issues.map(
    (issue) =>
      `- ${relativeLaunchPath(path)}:${issue.path.join(".") || "<root>"}: ${issue.message}`,
  );
  throw new Error(
    ["Launch-data schema validation failed:", ...issues].join("\n"),
  );
}

function parseCsv(text: string, path: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      record.push(cell);
      cell = "";
    } else if (character === "\n") {
      record.push(cell.replace(/\r$/, ""));
      if (record.some((value) => value !== "")) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) {
    throw new Error(
      `${relativeLaunchPath(path)}: unterminated quoted CSV cell`,
    );
  }
  if (cell || record.length > 0) {
    record.push(cell.replace(/\r$/, ""));
    records.push(record);
  }
  if (records.length === 0) {
    throw new Error(`${relativeLaunchPath(path)}: CSV file is empty`);
  }

  const headers = records[0].map((header) => header.trim());
  const duplicateHeaders = headers.filter(
    (header, index) => headers.indexOf(header) !== index,
  );
  if (duplicateHeaders.length > 0) {
    throw new Error(
      `${relativeLaunchPath(path)}: duplicate CSV headers: ${[...new Set(duplicateHeaders)].join(", ")}`,
    );
  }

  return records.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(
        `${relativeLaunchPath(path)}:${rowIndex + 2}: expected ${headers.length} columns, received ${values.length}`,
      );
    }
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index].trim()]),
    );
  });
}

function parseBoolean(
  value: string | undefined,
  path: string,
  line: number,
  field: string,
) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(
    `${relativeLaunchPath(path)}:${line}:${field}: expected true or false`,
  );
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function relativeLaunchPath(path: string) {
  return path.replace(`${projectRoot}/`, "");
}
