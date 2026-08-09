import pool from "../config/db.js"
import { clearSettingsCache } from "../middlewares/auth.middleware.js"

export async function getSettings(req, res) {
  try {
    //// 1. Lấy tọa độ công ty , bán kính chấm công cho phép và trạng thái khóa thiết bị id = 1
    const [rows] = await pool.execute(
      "SELECT company_lat, company_lng, max_distance, device_lock_enabled FROM settings WHERE id = 1"
    )
    //Nếu trong DB chưa tạo dòng id = 1 thì trả về thông số mặc định (bán kính 500m, device_lock tắt)
    if (rows.length === 0) {
      return res.json({ company_lat: null, company_lng: null, max_distance: 500, device_lock_enabled: 0 })
    }
    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

//Cập nhật tọa độ GPS văn phòng & bán kính tối đa
export async function updateSettings(req, res) {
  try {
    const { company_lat, company_lng, max_distance } = req.body
    // Kiểm tra dòng id = 1 đã tồn tại trong bảng settings chưa
    const [existing] = await pool.execute("SELECT id FROM settings WHERE id = 1")
    // Nếu chưa có thì insert
    if (existing.length === 0) {
      await pool.execute(
        "INSERT INTO settings (id, company_lat, company_lng, max_distance) VALUES (1, ?, ?, ?)",
        [company_lat, company_lng, max_distance || 500]
      )
    } else { // Nếu đã có thì update
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

//Bật/Tắt khóa thiết bị
export async function updateDeviceLock(req, res) {
  try {
    const { device_lock_enabled } = req.body
    const value = device_lock_enabled ? 1 : 0

    //Kiểm tra và cập nhật trạng thái device_lock_enabled (1 hoặc 0) cho dòng id = 1
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
    // Xóa bộ nhớ đệm (cache) cấu hình ở middleware để các request tiếp theo dùng ngay cài đặt mới
    clearSettingsCache()
    return res.json({ message: value ? "Đã bật Device Lock" : "Đã tắt Device Lock", device_lock_enabled: value })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

//Cài mật khẩu máy quét 
export async function updateScanPassword(req, res) {
  try {
    const { scan_password } = req.body
    if (!scan_password) return res.status(400).json({ message: "Vui lòng nhập mật khẩu" })
    //cập nhật mk
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

//Kích hoạt máy quét ở sảnh
export async function activateScanTerminal(req, res) {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ message: "Vui lòng nhập mật khẩu" })
    //kiểm tra mk
    const [rows] = await pool.execute("SELECT scan_password FROM settings WHERE id = 1")
    if (rows.length === 0 || !rows[0].scan_password) {
      return res.status(400).json({ message: "Chưa cài đặt mật khẩu máy quét" })
    }
    if (password !== rows[0].scan_password) {
      return res.status(401).json({ message: "Mật khẩu không đúng" })
    } 
    // Sinh token ngẫu nhiên
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    //lưu token vào db
    await pool.execute("UPDATE settings SET scan_token=? WHERE id=1", [token])
    return res.json({ token })
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}
