const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });
const { Pool } = require("pg");
const { getLatestRunData } = require("./getLatestRunData");


const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function main() {
  try {
    const who = await pool.query(
      "SELECT current_database() AS db, current_user AS usr;",
    );
    console.log("CONNECTED_TO:", who.rows[0]);
    const { summaryRows, byRuleRows, failureRows } =
      await getLatestRunData(pool);
    console.log("SUMMARY:", summaryRows[0]);
    console.log("BY_RULE:", byRuleRows);
    console.log("FAILURES:", failureRows);
  } catch (err) {
    console.error("main failed:", err.message);
  } finally {
    await pool.end();
  }
}

main();
