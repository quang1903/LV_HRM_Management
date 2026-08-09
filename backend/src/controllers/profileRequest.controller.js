import pool from "../config/db.js"

const ALLOWED_FIELDS = ["phone", "address"]
const fieldLabel = { phone: "Số điện thoại", address: "Địa chỉ" }

export async function createRequest(req, res) {
  try {
    //Kiểm tra tài khoản đã liên kết với nhân viên nào chưa
    if (!req.user.employee_id) {
      return res.status(400).json({ message: "Tài khoản chưa gắn nhân viên" })
    }
    //Kiểm tra trường cần sửa có nằm trong danh sách cho phép (phone, address) hay không
    const { field_name, new_value } = req.body
    if (!ALLOWED_FIELDS.includes(field_name)) {
      return res.status(400).json({ message: "Trường này không được phép gửi yêu cầu thay đổi" })
    }
    //Kiểm tra giá trị mới có rỗng không
    if (!new_value || !new_value.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập giá trị mới" })
    }

    //Chặn nếu đã có yêu cầu Chờ duyệt cho cùng trường này
    const [pending] = await pool.execute(
      "SELECT id FROM profile_change_requests WHERE employee_id = ? AND field_name = ? AND status = 'Cho duyet'",
      [req.user.employee_id, field_name]
    )
    if (pending.length > 0) {
      return res.status(400).json({ message: `Bạn đã có yêu cầu đang chờ duyệt cho ${fieldLabel[field_name]}, vui lòng đợi xử lý` })
    }

    //Lấy giá trị cũ trong bảng employees để so sánh
    const [empRows] = await pool.execute(`SELECT ${field_name} as current_value FROM employees WHERE id = ?`, [req.user.employee_id])
    if (empRows.length === 0) return res.status(404).json({ message: "Không tìm thấy nhân viên" })

    const old_value = empRows[0].current_value

    //Không tạo yêu cầu nếu giá trị mới giống giá trị hiện tại
    if ((old_value || "") === new_value.trim()) {
      return res.status(400).json({ message: "Giá trị mới giống giá trị hiện tại, không cần gửi yêu cầu" })
    }

    //Thêm yêu cầu mới vào bảng profile_change_requests với trạng thái mặc định 'Cho duyet'
    await pool.execute(
      "INSERT INTO profile_change_requests (employee_id, field_name, old_value, new_value) VALUES (?, ?, ?, ?)",
      [req.user.employee_id, field_name, old_value, new_value.trim()]
    )

    return res.status(201).json({ message: "Đã gửi yêu cầu thay đổi, vui lòng chờ HR duyệt" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

//Xem yêu cầu của tôi
export async function getMyRequests(req, res) {
  try {
    if (!req.user.employee_id) return res.json([])
    const [rows] = await pool.execute(
      "SELECT * FROM profile_change_requests WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10",
      [req.user.employee_id]
    )
    return res.json(rows)
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" })
  }
}

//Admin & HR xem tất cả yêu cầu
export async function getAllRequests(req, res) {
  try {
    const { status } = req.query
    let query = `
      SELECT r.*, e.full_name, e.employee_code
      FROM profile_change_requests r
      LEFT JOIN employees e ON r.employee_id = e.id
    `
    const params = []
    //lọc theo trạng thái
    if (status) {
      query += " WHERE r.status = ?"
      params.push(status)
    }
    query += " ORDER BY r.created_at DESC"
    const [rows] = await pool.execute(query, params)
    return res.json(rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function approveRequest(req, res) {
  try {
    //kt ycau có ko
    const [rows] = await pool.execute("SELECT * FROM profile_change_requests WHERE id = ?", [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy yêu cầu" })

    // Kiểm tra nhân viên còn làm việc không
    const [empRows] = await pool.execute(
      "SELECT status FROM employees WHERE id = ?", [rows[0].employee_id]
    )
    if (empRows.length > 0 && empRows[0].status === 'Nghi viec') {
      return res.status(400).json({ message: "Nhân viên đã nghỉ việc, không thể duyệt yêu cầu" })
    }

    const request = rows[0]
    //Đảm bảo yêu cầu chưa từng được xử lý trước đó
      if (request.status !== "Cho duyet") return res.status(400).json({ message: "Yêu cầu này đã được xử lý trước đó" })

    // Kiểm tra trường dữ liệu có hợp lệ không
    if (!ALLOWED_FIELDS.includes(request.field_name)) {
      return res.status(400).json({ message: "Trường dữ liệu không hợp lệ" })
    }

    //Cập nhật trực tiếp giá trị new_value vào bảng employees
    await pool.execute(`UPDATE employees SET ${request.field_name} = ? WHERE id = ?`, [request.new_value, request.employee_id])
    //Đổi trạng thái yêu cầu sang 'Da duyet', lưu lại ai duyệt (reviewed_by) và thời gian (reviewed_at)
    await pool.execute(
      "UPDATE profile_change_requests SET status='Da duyet', reviewed_by=?, reviewed_at=NOW() WHERE id=?",
      [req.user.id, req.params.id]
    )

    return res.json({ message: "Đã duyệt yêu cầu" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

export async function rejectRequest(req, res) {
  try {
    const { reject_reason } = req.body
    const [rows] = await pool.execute("SELECT * FROM profile_change_requests WHERE id = ?", [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy yêu cầu" })
    if (rows[0].status !== "Cho duyet") return res.status(400).json({ message: "Yêu cầu này đã được xử lý trước đó" })

    await pool.execute(
      "UPDATE profile_change_requests SET status='Tu choi', reviewed_by=?, reviewed_at=NOW(), reject_reason=? WHERE id=?",
      [req.user.id, reject_reason || null, req.params.id]
    )

    return res.json({ message: "Đã từ chối yêu cầu" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Lỗi server" })
  }
}
