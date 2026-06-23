import mysql from "mysql2/promise"
import dotenv from "dotenv"
dotenv.config()

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "hrm_db",
  timezone: '+07:00',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 3,
})

try {
  const conn = await pool.getConnection()
  console.log("✅ Kết nối MySQL thành công!")
  conn.release()
} catch (err) {
  console.error("❌ Kết nối MySQL thất bại:", err.message)
}

export default pool