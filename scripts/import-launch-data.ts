import {
  loadLaunchSourceData,
  readActiveLaunchData,
  writeActiveLaunchData,
} from "./lib/launch-data-files";
import { validateLaunchData } from "./lib/launch-validation";

async function main() {
  const importedData = await loadLaunchSourceData();
  if (!importedData) {
    console.log(
      "No real launch-data source files found. Templates were not imported and active preview data was preserved.",
    );
    return;
  }

  const result = validateLaunchData(importedData, "preview");
  if (result.errors.length > 0) {
    printIssues("Launch-data import rejected", result.errors);
    process.exitCode = 1;
    return;
  }

  const currentData = await readActiveLaunchData();
  const destructiveChanges = currentData.products.flatMap((currentRecord) => {
    if (currentRecord.verificationStatus !== "verified") return [];
    const replacement = importedData.products.find(
      (candidate) =>
        candidate.productId === currentRecord.productId &&
        candidate.variantId === currentRecord.variantId,
    );
    return !replacement || replacement.verificationStatus !== "verified"
      ? [`${currentRecord.productId}/${currentRecord.variantId}`]
      : [];
  });
  if (
    destructiveChanges.length > 0 &&
    !process.argv.includes("--allow-verified-replacement")
  ) {
    printIssues(
      "Import would replace or remove manually verified product rows. Review the source files, then rerun with --allow-verified-replacement only if intentional.",
      destructiveChanges,
    );
    process.exitCode = 1;
    return;
  }

  console.warn(
    "Import target is data/launch/launch-data.json only; source catalog evidence files are never overwritten.",
  );
  const status = await writeActiveLaunchData(importedData);
  console.log(`Launch data ${status}. Source hash: ${importedData.sourceHash}`);
  if (result.warnings.length > 0) {
    printIssues("Preview-allowed unresolved items", result.warnings);
  }
}

function printIssues(title: string, issues: string[]) {
  console.error(`${title}:`);
  for (const issue of issues) console.error(`- ${issue}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
