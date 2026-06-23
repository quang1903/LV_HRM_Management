# Tổng hợp các Lỗi Nghiệp vụ và Giải pháp (Backend HRM)

Tài liệu này lưu trữ toàn bộ lịch sử các lỗi nghiệp vụ quan trọng đã được rà soát và khắc phục trong hệ thống Backend HRM. Việc lưu trữ thành tài liệu sẽ giúp cả tôi và bạn dễ dàng đọc lại và ghi nhớ trong những lần làm việc tiếp theo.

---

## 1. Lỗi Bảo mật Refresh Token (Tài khoản bị khóa)
**File:** `auth.controller.js` (Hàm `refreshToken`)
**Vấn đề:** Hệ thống cho phép cấp Access Token mới thông qua Refresh Token mà không kiểm tra xem User đó có đang bị vô hiệu hóa (`is_active = 0`) hay không.
**Giải pháp đã áp dụng:** Kiểm tra `is_active` trước khi cấp Token mới. Xóa Refresh Token rác khỏi DB.
```javascript
if (users[0].is_active !== 1) {
  await pool.execute("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken])
  return res.status(401).json({ message: "Tài khoản đã bị vô hiệu hóa" })
}
```

---

## 2. Lỗi Ràng buộc Ngày Tháng Hợp Đồng
**File:** `contract.controller.js` (Hàm `createContract` và `renewContract`)
**Vấn đề:** Cho phép tạo mới hoặc gia hạn hợp đồng với `Ngày kết thúc` lùi về quá khứ (nhỏ hơn `Ngày bắt đầu`).
**Giải pháp đã áp dụng:** So sánh `end_date` và `start_date` gửi lên từ Client. Khi gia hạn thì truy vấn `start_date` gốc từ Database để so sánh.
```javascript
const [existing] = await pool.execute("SELECT id, start_date FROM contracts WHERE id = ?", [req.params.id])
if (new Date(end_date) <= new Date(existing[0].start_date)) {
  return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu hợp đồng" })
}
```

---

## 3. Lỗi Check-out Ca Đêm (Qua 12h đêm)
**File:** `attendance.controller.js` (Hàm `checkOut`)
**Vấn đề:** Hệ thống cũ cố định ngày Check-out bằng biến `today`. Nhân viên làm ca đêm sẽ không thể Check-out được vì lệch `work_date`.
**Giải pháp đã áp dụng:** Tìm bản ghi Check-in gần nhất mà nhân viên CHƯA Check-out để chốt giờ.
```javascript
const [existing] = await pool.execute(
  "SELECT id, check_in FROM attendances WHERE employee_id = ? AND check_in IS NOT NULL AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
  [employee.id]
)
```

---

## 4. Lỗi Sập API do Trùng Username khi Tạo Nhân Sự
**File:** `employee.controller.js` (Hàm `createEmployee`)
**Vấn đề:** Sinh `username` tự động từ tiền tố email dễ gây trùng lặp và văng lỗi 500 (Duplicate).
**Giải pháp đã áp dụng:** Dùng vòng lặp kiểm tra Database liên tục và tự động tăng số đếm (`anh.nguyen1`, `anh.nguyen2`).
```javascript
let baseUsername = email.split("@")[0]
let username = baseUsername
let counter = 1
while (true) {
  const [dup] = await pool.execute("SELECT id FROM users WHERE username = ?", [username])
  if (dup.length === 0) break
  username = `${baseUsername}${counter}`
  counter++
}
```

---

## 5. Lỗi Bảo mật API (Lỗi phân quyền rò rỉ dữ liệu)
**File:** `contract.routes.js`, `report.routes.js`, `employee.controller.js`
**Vấn đề:** Nhân viên có thể bypass giao diện, dùng token để gọi trực tiếp các API lấy hợp đồng, báo cáo toàn công ty và hồ sơ cá nhân (CCCD, địa chỉ) của nhân sự khác.
**Giải pháp đã áp dụng:** 
- Gắn `roleMiddleware("admin", "hr", "manager")` để cấm nhân viên truy cập API Hợp đồng & Báo cáo.
- Ở API Hồ sơ nhân sự, kiểm tra nếu `req.user.role === "employee"` thì tự động `delete` các trường nhạy cảm (`id_card`, `address`, `birth_date`) của người khác, chỉ để lại thông tin danh bạ cơ bản.

## 6. Lỗi Quên đồng bộ Email sang bảng Users (Lỗi 2)
**File:** `employee.controller.js` (Hàm `updateEmployee`)
**Vấn đề:** Khi cập nhật email của nhân viên ở bảng `employees`, hệ thống không update email đó sang bảng `users`, dẫn đến sai lệch dữ liệu và lỗi đăng nhập. Chưa có bước kiểm tra trùng email và sai định dạng email khi cập nhật.
**Giải pháp đã áp dụng:** 
- Bổ sung kiểm tra định dạng email bằng `emailRegex` để tránh nhập sai cú pháp.
- Bổ sung logic `SELECT ... email = ? AND id != ?` để chặn trùng email.
- Thêm lệnh `UPDATE users SET email = ? WHERE employee_id = ?` để đồng bộ ngay lập tức.

## 7. Lỗi Logic Ngày Nghỉ Phép (Lỗi 4)
**File:** `leave.controller.js` (Hàm `createLeave`)
**Vấn đề:** Đơn xin nghỉ phép cho phép người dùng chọn `Ngày kết thúc` lùi về trước `Ngày bắt đầu` (Ví dụ: Bắt đầu 20/10 nhưng kết thúc 15/10), gây sai lệch dữ liệu chấm công.
**Giải pháp đã áp dụng:** 
- Bổ sung logic kiểm tra `if (new Date(end_date) < new Date(start_date))` trước khi INSERT vào Database.

---

## 8. Lỗi Xóa Phòng ban / Chức vụ gây sập Database (Lỗi 5)
**File:** `department.controller.js`, `position.controller.js`
**Vấn đề:** Khi xóa phòng ban hoặc chức vụ, hệ thống không kiểm tra kỹ xem có nhân viên nào đang trực thuộc hay không, dẫn đến lỗi khóa ngoại (Foreign Key Constraint) hoặc mồ côi dữ liệu.
**Giải pháp đã áp dụng:** 
- `deletePosition`: Thêm truy vấn kiểm tra xem có nhân viên nào đang giữ chức vụ này không trước khi xóa.
- `deleteDepartment`: Bỏ điều kiện `status = 'Dang lam'`, kiểm tra toàn bộ nhân viên (kể cả đã nghỉ) để không làm hỏng lịch sử dữ liệu.

---

## 9. Lỗi 1 Nhân viên gán nhiều Tài khoản User (Lỗi 8)
**File:** `user.controller.js`
**Vấn đề:** Một nhân viên có thể bị gán cho nhiều tài khoản người dùng khác nhau, gây rác dữ liệu và nhầm lẫn phân quyền.
**Giải pháp đã áp dụng:** 
- Bổ sung logic kiểm tra `dupEmp` ở cả 2 hàm `createUser` và `updateUser`.
- Đảm bảo một `employee_id` chỉ được sở hữu duy nhất một tài khoản `users` tại một thời điểm.

---

## 10. Lỗi Bảo mật Xin Nghỉ Phép Hộ Người Khác (Lỗi 10 - IDOR)
**File:** `leave.controller.js` (Hàm `createLeave`)
**Vấn đề:** API nhận `employee_id` từ `req.body`, khiến một nhân viên có thể sửa request để gửi đơn xin nghỉ phép giùm người khác (ví dụ: xin nghỉ giùm Giám đốc).
**Giải pháp đã áp dụng:** 
- Ép kiểu bằng logic: Nếu là `employee` thì ghi đè `employee_id = req.user.employee_id` từ Token.
- Hỗ trợ admin/hr linh hoạt: Admin/HR vẫn được phép dùng `employee_id` từ `body` để làm nghiệp vụ tạo đơn giùm.

---

## Các Lỗi Đang Chờ Xử Lý
- **Lỗi 9:** Thiếu logic trừ Quỹ phép năm (Leave Balances).
