import { Router } from "express"
import { getAttendances, getAttendanceById, createAttendance, updateAttendance, checkIn, checkOut } from "../controllers/attendance.controller.js"
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js"
import pool from "../config/db.js"

const router = Router()

// Middleware kiểm tra Terminal Token
async function verifyTerminalToken(req, res, next) {
  try {
    const token = req.headers["x-terminal-token"]
    if (!token) return res.status(401).json({ message: "Thiết bị chưa được kích hoạt" })
    const [rows] = await pool.execute("SELECT scan_token FROM settings WHERE id = 1")
    if (rows.length === 0 || rows[0].scan_token !== token) {
      return res.status(401).json({ message: "Token không hợp lệ, vui lòng kích hoạt lại máy quét" })
    }
    next()
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

router.get("/",    authMiddleware, getAttendances)
router.get("/:id", authMiddleware, getAttendanceById)
router.post("/",   authMiddleware, roleMiddleware("admin", "hr"), createAttendance)
router.put("/:id", authMiddleware, roleMiddleware("admin", "hr"), updateAttendance)
router.post("/checkin",  verifyTerminalToken, checkIn)
router.post("/checkout", verifyTerminalToken, checkOut)

export default router