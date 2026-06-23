import pool from "../config/db.js"

export async function getSettings(req, res) {
  try {
    const [rows] = await pool.execute("SELECT * FROM settings WHERE id = 1")
    if (rows.length === 0) {
      return res.json({ company_lat: null, company_lng: null, max_distance: 500 })
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
