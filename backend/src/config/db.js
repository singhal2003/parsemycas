const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initSchema() {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf-8");
  await pool.query(sql);
}

module.exports = { pool, initSchema };
