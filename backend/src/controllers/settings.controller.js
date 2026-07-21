import pool from "../config/db.js"

export async function getSettings(req, res) {
  try {
    const [rows] = await pool.execute(
      "SELECT company_lat, company_lng, max_distance, device_lock_enabled FROM settings WHERE id = 1"
    )
    if (rows.length === 0) {
      return res.json({ company_lat: null, company_lng: null, max_distance: 500, device_lock_enabled: 0 })
    }
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateSettings(req, res) {
  try {
    const { company_lat, company_lng, max_distance } = req.body
    const [existing] = await pool.execute("SELECT id FROM settings WHERE id = 1")
    if (existing.length === 0) {
      await pool.execute(
        "INSERT INTO settings (id, company_lat, company_lng, max_distance) VALUES (1, ?, ?, ?)",
        [company_lat, company_lng, max_distance || 500]
      )
    } else {
      await pool.execute(
        "UPDATE settings SET company_lat=?, company_lng=?, max_distance=? WHERE id=1",
        [company_lat, company_lng, max_distance || 500]
      )
    }
    return res.json({ message: "Cập nhật vị trí thành công" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateDeviceLock(req, res) {
  try {
    const { device_lock_enabled } = req.body
    const value = device_lock_enabled ? 1 : 0

    const [existing] = await pool.execute("SELECT id FROM settings WHERE id = 1")
    if (existing.length === 0) {
      await pool.execute(
        "INSERT INTO settings (id, device_lock_enabled) VALUES (1, ?)",
        [value]
      )
    } else {
      await pool.execute(
        "UPDATE settings SET device_lock_enabled=? WHERE id=1",
        [value]
      )
    }
    return res.json({ message: value ? "Đã bật Device Lock" : "Đã tắt Device Lock", device_lock_enabled: value })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function updateScanPassword(req, res) {
  try {
    const { scan_password } = req.body
    if (!scan_password) return res.status(400).json({ message: "Vui lòng nhập mật khẩu" })
    const [existing] = await pool.execute("SELECT id FROM settings WHERE id = 1")
    if (existing.length === 0) {
      await pool.execute("INSERT INTO settings (id, scan_password) VALUES (1, ?)", [scan_password])
    } else {
      await pool.execute("UPDATE settings SET scan_password=? WHERE id=1", [scan_password])
    }
    return res.json({ message: "Đã lưu mật khẩu máy quét" })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function activateScanTerminal(req, res) {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ message: "Vui lòng nhập mật khẩu" })
    const [rows] = await pool.execute("SELECT scan_password FROM settings WHERE id = 1")
    if (rows.length === 0 || !rows[0].scan_password) {
      return res.status(400).json({ message: "Chưa cài đặt mật khẩu máy quét" })
    }
    if (password !== rows[0].scan_password) {
      return res.status(401).json({ message: "Mật khẩu không đúng" })
    }
    // Sinh token ngẫu nhiên
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    await pool.execute("UPDATE settings SET scan_token=? WHERE id=1", [token])
    return res.json({ token })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}
