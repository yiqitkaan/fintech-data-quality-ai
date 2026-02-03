const { runSqlFile } = require("./runSqlFile");
async function getLatestRunData(pool) {
  if (!pool) throw new Error("pool is required");
  try {
    const summaryRows = await runSqlFile(
      pool,
      "db/ai_inputs/latest_run_summary.sql",
    );
    const byRuleRows = await runSqlFile(
      pool,
      "db/ai_inputs/latest_run_by_rule.sql",
    );
    const failureRows = await runSqlFile(
      pool,
      "db/ai_inputs/latest_run_failures.sql",
    );
    return { summaryRows, byRuleRows, failureRows };
  } catch (err) {
    console.error("getLatestRunData failed:", err.message);
    throw err;
  }
}

module.exports = { getLatestRunData };
