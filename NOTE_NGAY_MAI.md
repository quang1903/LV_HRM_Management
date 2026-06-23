# Bàn giao Công việc (Tổng hợp hôm nay & Nhiệm vụ ngày mai)

Dưới đây là ghi chép cực kỳ chi tiết về toàn bộ những phần code đã được sửa/thêm trong hôm nay, cũng như 3 nhiệm vụ cuối cùng cho ngày mai. Khi mở lại, bạn và mình có thể đọc Note này để nắm lại 100% ngữ cảnh.

---

## 🏆 TỔNG HỢP TOÀN BỘ CÔNG VIỆC ĐÃ HOÀN THÀNH HÔM NAY

### 1. Tính năng Device Lock (Khóa thiết bị cố định)
- **Mục đích:** Chặn nhân viên đứng ở công ty lấy tài khoản của người khác đăng nhập để chấm công hộ.
- **Đã làm:** 
  - Tạo `frontend/lib/device.ts` sinh mã UUID lưu vào localStorage.
  - Sửa `AuthContext` và `api.ts` để truyền header `X-Device-Id`.
  - Sửa `auth.controller.js` (hàm login) ghi nhận thiết bị lần đầu, từ chối thiết bị lạ.
  - Thêm nút **Reset thiết bị** (icon Smartphone) cho Admin tại trang Quản lý tài khoản (`user-table.tsx`).
  - *Lưu ý cho bạn:* Bạn cần tự chạy SQL `ALTER TABLE users ADD COLUMN device_id VARCHAR(255);` trong PHPMyAdmin.

### 2. Tính năng QR Xoay 30 giây (TOTP)
- **Mục đích:** Chống nhân viên chụp màn hình mã QR tĩnh gửi cho đồng nghiệp nhờ quét hộ.
- **Đã làm:**
  - Cài thư viện `qrcode`, `html5-qrcode` (frontend) và `otplib` (backend).
  - Viết API `getMyQRSecret` trong backend sử dụng khóa bí mật để sinh OTP 6 số.
  - Tạo UI trang cá nhân (`frontend/app/profile/page.tsx`) hiển thị mã QR có thanh tiến trình tự đếm ngược 30s.
  - Sửa API `checkIn` / `checkOut` để cắt mã QR (`MãNV:OTP`) và xác thực hợp lệ.
  - Viết trang giao diện `/scan` mở camera quét QR thật.

### 3. Sửa trọn bộ các Bug Logic & Bảo mật cốt lõi
- **Lỗi 1 (Refresh Token):** Đã sửa lỗi Refresh token cho phép NV bị vô hiệu hóa vẫn lấy được token mới.
- **Lỗi 2 (Đồng bộ Email):** Đã bổ sung lệnh cập nhật đồng thời Email của User khi Admin sửa Email của Employee.
- **Lỗi 3 (Bảo mật API):** Đã gắn `roleMiddleware` chặt chẽ, ẩn số CCCD/Ngày sinh khi nhân viên tự xem danh sách (tránh rò rỉ thông tin cá nhân).
- **Lỗi 7 & 8 (Trùng lặp dữ liệu):** Đã code chặn việc tạo trùng Username/Email hoặc gán 2 tài khoản cho cùng 1 nhân viên.
- **Lỗi 10 (Chống IDOR Nghỉ phép):** Ép chặt điều kiện `req.user.employee_id` khi xóa/sửa đơn phép để tránh việc sửa trộm đơn người khác.

### 4. Tối ưu Giao diện Mobile (Responsive)
- Cập nhật các Component bảng (Users, Reports, Contracts...) thêm thuộc tính `overflow-x-auto` và `min-w-[xxx]` để vuốt ngang trên điện thoại không bị vỡ khung.
- Sửa thanh công cụ tìm kiếm (`w-full sm:w-auto`).
- Cấu hình lại nút Chấm công vào/ra để không bị bóp chữ trên màn hình nhỏ.

---

## 🚀 3 NHIỆM VỤ CÒN LẠI CHO NGÀY MAI
Ngay khi bắt đầu ca ngày mai, bạn chỉ cần báo mình **"Làm tiếp 3 tính năng còn lại"**:

1. **Xuất báo cáo ra file Excel:** Cài `xlsx` vào frontend, nối logic vào nút "Xuất Excel" ở trang Báo cáo.
2. **Trang Cá nhân Nhân viên (Profile):** Đổ thông tin cá nhân ra giao diện, viết API `updateMyProfile` cho phép nhân viên tự cập nhật SĐT, địa chỉ, ảnh đại diện (khóa CCCD, chức vụ).
3. **Đổi Mật Khẩu Cá Nhân:** Viết API `changeMyPassword` kiểm tra mật khẩu cũ (bcrypt), tích hợp form đổi mật khẩu vào trang Profile.

---
*Mọi dữ liệu và tiến độ đã được lưu lại an toàn. Chúc bạn một buổi tối nghỉ ngơi thật thoải mái!* 🌙
