const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });
const fs = require("fs");
const { Pool } = require("pg");
const { getLatestRunData } = require("./getLatestRunData");
const reportPath = path.resolve(
  __dirname,
  "..",
  "..",
  "reports",
  "latest_run.json",
);
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function main() {
  try {
    const {
      summaryRows,
      byRuleRows,
      failureRows,
      totalAccountCount,
      totalCustomerCount,
      totalTransferCount,
    } = await getLatestRunData(pool);

    const accountEntityCount = totalAccountCount[0]
      ? Number(totalAccountCount[0].total_account_count)
      : 0;

    const customerEntityCount = totalCustomerCount[0]
      ? Number(totalCustomerCount[0].total_customer_count)
      : 0;

    const transferEntityCount = totalTransferCount[0]
      ? Number(totalTransferCount[0].total_transfer_count)
      : 0;

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

    const failingTransferCount = new Set(
      failures
        .filter((f) => f.entityType === "Transfer")
        .map((f) => f.entityId),
    ).size;

    const failingAccountCount = new Set(
      failures.filter((f) => f.entityType === "Account").map((f) => f.entityId),
    ).size;

    const failingCustomerCount = new Set(
      failures
        .filter((f) => f.entityType === "Customer")
        .map((f) => f.entityId),
    ).size;

    const passingTransferCount = transferEntityCount - failingTransferCount;
    const passingAccountCount = accountEntityCount - failingAccountCount;
    const passingCustomerCount = customerEntityCount - failingCustomerCount;

    const transferFailureRate =
      transferEntityCount === 0
        ? 0
        : Number(((failingTransferCount / transferEntityCount) * 100).toFixed(2));

    const transferPassRate =
      transferEntityCount === 0
        ? 0
        : Number(((passingTransferCount / transferEntityCount) * 100).toFixed(2));

    const accountFailureRate =
      accountEntityCount === 0
        ? 0
        : Number(((failingAccountCount / accountEntityCount) * 100).toFixed(2));

    const accountPassRate =
      accountEntityCount === 0
        ? 0
        : Number(((passingAccountCount / accountEntityCount) * 100).toFixed(2));

    const customerFailureRate =
      customerEntityCount === 0
        ? 0
        : Number(((failingCustomerCount / customerEntityCount) * 100).toFixed(2));

    const customerPassRate =
      customerEntityCount === 0
        ? 0
        : Number(((passingCustomerCount / customerEntityCount) * 100).toFixed(2));



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
      summary: {
        totalFailures,
      },
      byRule,
      samplesByRule,
      failures,
      entityHealth: {
        Transfer: {
          total: transferEntityCount,
          failing: failingTransferCount,
          passing: passingTransferCount,
          failureRate: transferFailureRate,
          passRate: transferPassRate,
        },
        Account: {
          total: accountEntityCount,
          failing: failingAccountCount,
          passing: passingAccountCount,
          failureRate: accountFailureRate,
          passRate: accountPassRate,
        },
        Customer: {
          total: customerEntityCount,
          failing: failingCustomerCount,
          passing: passingCustomerCount,
          failureRate: customerFailureRate,
          passRate: customerPassRate,
        },
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

    console.log("WROTE:", reportPath);
    console.log("RUN:", runId, "TOTAL_FAILS:", totalFailures);
    return reportPath;
  } catch (err) {
    console.error("buildLatestRunReport failed:", err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

module.exports = { buildLatestRunReport: main };
