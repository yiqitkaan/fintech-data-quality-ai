const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const { buildLatestRunReport } = require("../dq/buildLatestRunReport");
const { buildCtoReport } = require("../ai/buildCtoReport");

async function runPipeline() {
  console.log("---- DATA QUALITY PIPELINE START ----");

  try {
    console.log("1) Building latest_run.json...");
    await buildLatestRunReport();
    console.log("✓ latest_run.json created");

    console.log("2) Generating CTO AI report...");
    await buildCtoReport();
    console.log("✓ CTO report created");

    console.log("---- PIPELINE SUCCESS ----");
  } catch (err) {
    console.error("PIPELINE FAILED:", err.message);
    process.exit(1);
  }
}

runPipeline();