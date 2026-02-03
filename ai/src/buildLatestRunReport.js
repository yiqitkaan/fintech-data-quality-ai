const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const fs = require("fs");
const { Pool } = require("pg");
const { getLatestRunData } = require("./getLatestRunData");
const reportPath = path.resolve(__dirname, "..", "reports", "latest_run.json");

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function main() {
  try {
    const { summaryRows, byRuleRows, failureRows } =
      await getLatestRunData(pool);

    const summary = summaryRows[0] || null;
    const runId = summary ? Number(summary.runid) : null;
    const runTime = summary ? summary.run_time : null;
    const totalFailures = summary ? Number(summary.total_failures) : 0;

    const byRule = byRuleRows.map((row) => ({
      ruleCode: row.rulecode,
      failCount: Number(row.fail_count),
    }));

    const failures = failureRows.map((row) => ({
      ruleCode: row.rulecode,
      entityType: row.entitytype,
      entityId: Number(row.entityid),
    }));

    const SAMPLE_LIMIT = 3;

    const samplesByRule = {};

    for (const f of failures) {
      if (!samplesByRule[f.ruleCode]) {
        samplesByRule[f.ruleCode] = [];
      }
      const alreadyAdded = samplesByRule[f.ruleCode].includes(f.entityId);
      if (!alreadyAdded && samplesByRule[f.ruleCode].length < SAMPLE_LIMIT) {
        samplesByRule[f.ruleCode].push(f.entityId);
      }
    }

    const generatedAt = new Date().toISOString();
    const meta = {
      runId,
      runTime,
      generatedAt,
      version: 1,
    };

    const report = {
      meta,
      summary : {
        totalFailures,
      }, 
      byRule,
      samplesByRule,
      failures,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

    console.log("WROTE:", reportPath);
    console.log("RUN:", runId, "TOTAL_FAILS:", totalFailures);
  } catch (err) {
    console.error("buildLatestRunReport failed:", err.message);
  } finally {
    await pool.end();
  }
}

main();
