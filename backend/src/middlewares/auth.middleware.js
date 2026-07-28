import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import pool from "../config/db.js"
dotenv.config()

// Cache settings 60 giây, không query DB mỗi request
let settingsCache = null
let settingsCacheTime = 0
const CACHE_TTL = 60 * 1000

export function clearSettingsCache() {
  settingsCache = null
  settingsCacheTime = 0
}

async function getDeviceLockEnabled() {
  const now = Date.now()
  if (settingsCache !== null && now - settingsCacheTime < CACHE_TTL) {
    return settingsCache
  }
  const [rows] = await pool.execute("SELECT device_lock_enabled FROM settings WHERE id = 1")
  settingsCache = rows.length > 0 ? rows[0].device_lock_enabled === 1 : false
  settingsCacheTime = now
  return settingsCache
}

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token" })
  }
  const token = authHeader.split(" ")[1]
  const deviceId = req.headers["x-device-id"]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Device Lock: KHÔNG áp dụng cho Admin, và chỉ áp dụng khi setting đang bật
    if (decoded.role !== "admin") {
      const deviceLockEnabled = await getDeviceLockEnabled()

      if (deviceLockEnabled) {
        const [rows] = await pool.execute("SELECT device_id FROM users WHERE id = ?", [decoded.id])
        if (rows.length > 0 && rows[0].device_id) {
          if (!deviceId) {
            return res.status(401).json({ message: "Thiếu thông tin thiết bị (X-Device-Id)" })
          }
          if (rows[0].device_id !== deviceId) {
            return res.status(401).json({ message: "Tài khoản đang được sử dụng trên thiết bị khác" })
          }
        }
      }
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" })
  }
}

export function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" })
    }
    next()
  }
}