const path = require("path");
const fs = require("fs");

// Load environment variables from ai/.env (this script is under ai/src/ai)
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", ".env"),
});

const { buildCtoPrompt } = require("./promptBuilder");
const { callOpenAI } = require("./openaiClient");

// This file lives at: ai/src/ai/buildCtoReport.js
// We want reports at: ai/reports/
// Depending on how you run the script, resolving can be confusing; we try both candidates.
const reportsDirCandidates = [
  // correct: ai/src/ai -> ai/reports
  path.resolve(__dirname, "..", "..", "..", "reports"),
  // fallback (in case your folder layout differs)
  path.resolve(__dirname, "..", "..", "reports"),
];

function pickReportsDir() {
  for (const dir of reportsDirCandidates) {
    const p = path.join(dir, "latest_run.json");
    if (fs.existsSync(p)) return dir;
  }
  // Default to the first candidate; the error message below will show the attempted path.
  return reportsDirCandidates[0];
}

async function main() {
  const reportsDir = pickReportsDir();
  const latestRunPath = path.join(reportsDir, "latest_run.json");

  try {
    // Ensure reports directory exists (safe even if it already exists)
    fs.mkdirSync(reportsDir, { recursive: true });

    // 1) Read latest_run.json
    const raw = fs.readFileSync(latestRunPath, "utf8");
    const report = JSON.parse(raw);

    // 2) Build prompt
    const prompt = buildCtoPrompt(report);

    // 3) Call OpenAI
    const answer = await callOpenAI({ prompt });

    // Guard: avoid writing an empty report
    if (!answer || String(answer).trim().length === 0) {
      throw new Error("OpenAI returned empty output.");
    }

    // 4) Write CTO markdown report (runId-based filename to avoid overwriting)
    // Create a simple date stamp like DDMMYYYY (e.g., 04022026)
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const yyyy = String(now.getFullYear());
    const dateStamp = `${dd}${mm}${yyyy}`;

    // Unique output file name: cto_report_run_<runId>_<DDMMYYYY>.md

    const runId = report?.meta?.runId ?? "unknown";
    const ctoReportPath = path.join(
      reportsDir,
      `cto_report_run_${runId}_${dateStamp}.md`,
    );
    fs.writeFileSync(ctoReportPath, answer, "utf8");

    console.log("WROTE:", ctoReportPath);
    console.log("PREVIEW:\n", answer.slice(0, 300), "...");
  } catch (err) {
    console.error("buildCtoReport failed:", err?.message || err);
    console.error("Tried reading:", latestRunPath);
    process.exit(1);
  }
}

module.exports = { buildCtoReport: main };