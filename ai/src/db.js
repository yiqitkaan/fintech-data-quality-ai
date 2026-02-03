// ai/src/db.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function testConnection() {
  const res = await pool.query('SELECT now() AS server_time, current_database() AS db;');
  console.log(res.rows[0]);
  await pool.end();
}

testConnection().catch((err) => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});