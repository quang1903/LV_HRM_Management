import pool from "./src/config/db.js";

async function run() {
  try {
    await pool.execute("ALTER TABLE settings ADD COLUMN device_lock_enabled TINYINT(1) DEFAULT 0;");
    console.log("Migration added device_lock_enabled successfully");
  } catch (err) {
    console.log("Migration error:", err.message);
  }
  process.exit(0);
}
run();
