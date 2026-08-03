import { launchData } from "../src/config/launch-data";
import {
  printValidationResult,
  validateLaunchData,
} from "./lib/launch-validation";

const result = validateLaunchData(launchData, "production");
printValidationResult(result);
if (result.errors.length > 0) process.exitCode = 1;
