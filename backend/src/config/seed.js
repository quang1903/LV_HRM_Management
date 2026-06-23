import pool from "./db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

async function seed() {
  try {
    const hashed = await bcrypt.hash("123456", 10)
    console.log("✅ Hash password xong!")
    console.log("   Hash:", hashed)
    console.log("   Tất cả tài khoản mật khẩu: 123456")

    await pool.execute(
      "UPDATE users SET password = ? WHERE email IN ('admin@hrm.com','hr@hrm.com','manager@hrm.com','nv001@hrm.com')",
      [hashed]
    )
    console.log("✅ Đã update password vào DB!")
    process.exit(0)
  } catch (err) {
    console.error("❌ Lỗi:", err.message)
    process.exit(1)
  }
}

seed()