import { launchData, siteReleaseMode } from "../src/config/launch-data";
import {
  printValidationResult,
  validateLaunchData,
} from "./lib/launch-validation";

if (siteReleaseMode !== "production") {
  console.log(`Build guard: ${siteReleaseMode} release mode.`);
} else {
  const result = validateLaunchData(launchData, "production");
  printValidationResult(result);
  if (result.errors.length > 0) {
    console.error(
      "Production build blocked. Resolve launch data or use preview mode; files were not modified.",
    );
    process.exitCode = 1;
  }
}
