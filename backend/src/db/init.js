require("dotenv").config();
const { initSchema, pool } = require("../config/db");

initSchema()
  .then(() => {
    console.log("Database schema initialised.");
    return pool.end();
  })
  .catch((e) => {
    console.error("Failed to initialise schema:", e.message);
    process.exit(1);
  });
