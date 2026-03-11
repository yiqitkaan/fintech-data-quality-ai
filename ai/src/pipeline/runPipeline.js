const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const { buildLatestRunReport } = require("../dq/buildLatestRunReport");
const { buildCtoReport } = require("../ai/buildCtoReport");

function publishFrontendFiles({ latestRunPath, ctoReportPath }) {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const frontendDir = path.join(repoRoot, "frontend");

  if (!fs.existsSync(frontendDir)) {
    console.warn(
      `! Frontend directory not found at ${frontendDir}. Skipping frontend publish step.`,
    );
    return { skipped: true };
  }

  const frontendPublicDir = path.join(frontendDir, "public");
  fs.mkdirSync(frontendPublicDir, { recursive: true });

  const frontendLatestRunPath = path.join(frontendPublicDir, "latest_run.json");
  const frontendCtoReportPath = path.join(frontendPublicDir, "cto_report.md");

  fs.copyFileSync(latestRunPath, frontendLatestRunPath);
  fs.copyFileSync(ctoReportPath, frontendCtoReportPath);

  console.log(`✓ Copied latest_run.json to: ${frontendLatestRunPath}`);
  console.log(`✓ Copied cto_report.md to: ${frontendCtoReportPath}`);

  return { skipped: false };
}

async function runPipeline() {
  console.log("---- DATA QUALITY PIPELINE START ----");

  try {
    console.log("1) Building latest_run.json...");
    const latestRunPath = await buildLatestRunReport();
    if (!latestRunPath || !fs.existsSync(latestRunPath)) {
      throw new Error("latest_run.json was not generated successfully.");
    }
    console.log("✓ latest_run.json created");

    console.log("2) Generating CTO AI report...");
    const ctoReportPath = await buildCtoReport();
    if (!ctoReportPath || !fs.existsSync(ctoReportPath)) {
      throw new Error("CTO report markdown was not generated successfully.");
    }
    console.log("✓ CTO report created");

    console.log("3) Publishing files for frontend...");
    publishFrontendFiles({ latestRunPath, ctoReportPath });

    console.log("---- PIPELINE SUCCESS ----");
  } catch (err) {
    console.error("PIPELINE FAILED:", err.message);
    process.exit(1);
  }
}

runPipeline();
