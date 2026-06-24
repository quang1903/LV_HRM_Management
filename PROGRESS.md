# Ghi chú Tiến độ Dự án (Project Progress Notes)

Dưới đây là tóm tắt những hạng mục chúng ta đã hoàn thành và những hạng mục/vấn đề có thể cần tiếp tục xử lý trong thời gian tới.

## ✅ NHỮNG GÌ ĐÃ LÀM ĐƯỢC

### 1. Tính năng Khóa thiết bị (Device Lock)
- **Database:** Đã thêm trường `device_lock_enabled`.
- **Backend:** 
  - Cập nhật `settings.controller.js` để lưu trạng thái bật/tắt khóa thiết bị.
  - Sửa `auth.controller.js` (hàm login) để áp dụng luật 1 thiết bị cho mỗi tài khoản (ngoại trừ Admin) khi cấu hình này được bật.
- **Frontend:** Thêm nút Toggle vào trang Cài đặt (`settings/page.tsx`) cho phép Admin bật/tắt chế độ Khóa thiết bị.

### 2. Tính năng Cấu hình GPS Chấm công
- **Backend:** Thêm API lưu trữ Vĩ độ (`company_lat`), Kinh độ (`company_lng`), và Bán kính chấm công (`max_distance`).
- **Frontend:** Xây dựng giao diện trang Cài đặt, cho phép lấy tọa độ GPS tự động từ trình duyệt và lưu cấu hình.

### 3. Sửa lỗi Phân quyền cho Manager (Trang Users)
- Giải thích thành công cơ chế người dùng bị "văng ra" (force logout) khi tài khoản bị vô hiệu hóa (Do API Refresh Token trả về lỗi 401 chặn truy cập).
- **Cấp quyền Manager truy cập trang Người dùng (`/users`):**
  - Đã cấu hình cho phép Manager ở `frontend/middleware.ts` và `frontend/context/AuthContext.tsx`.
  - Đã mở quyền API ở `backend/src/routes/user.routes.js`.
  - **Sửa lỗi ngầm (Bug fix):** Đã xóa đoạn code check cứng `user.role !== "admin"` gây lỗi tự động đá Manager về trang chủ trong file `frontend/app/users/page.tsx`, và thay thế bằng hàm `hasPermission("/users")` chuẩn mực.

### 4. Phân quyền chi tiết (Row-Level Security) ở Backend
- **Bảo mật dữ liệu nghiêm ngặt:** Đã áp dụng logic lọc dữ liệu dựa trên phòng ban (Department) cho các tài khoản Manager.
  - Sửa API `getUsers` (`user.controller.js`): Manager chỉ thấy danh sách tài khoản thuộc phòng ban mình quản lý.
  - Sửa API `getEmployees` (`employee.controller.js`): Manager chỉ thấy danh sách nhân viên thuộc phòng ban mình quản lý.
- **Tính đồng bộ:** Vì API `getEmployees` được dùng chung ở nhiều component (trang Danh sách nhân viên và Dashboard), việc lọc dữ liệu ở backend giúp giải quyết tự động cho tất cả các trang Frontend mà không lo rò rỉ dữ liệu qua DevTools.

### 5. Khôi phục logic Timezone (Múi giờ Việt Nam) cho Chấm công
- **Vấn đề:** Bị lỗi lưu sai ngày giờ (bị lùi ngày) hoặc tính sai trạng thái "Đi trễ/Đúng giờ" do mã nguồn vô tình bị rollback về lấy giờ UTC chuẩn (`new Date().toISOString()`).
- **Khắc phục:** Đã tích hợp hàm `getVietnamTime()` trong file `attendance.controller.js`. Áp dụng lấy đúng giờ Việt Nam cho cả luồng Quét mã QR (`checkIn`) và Chấm công định vị GPS (`selfCheckIn`).

### 6. Viết lại lõi tạo TOTP (Mã QR Xoay vòng)
- **Vấn đề:** Gặp hàng loạt lỗi tương thích và syntax với thư viện `otplib` (module export lỗi, thiếu plugin crypto trên Node.js).
- **Khắc phục:** Loại bỏ hoàn toàn sự phụ thuộc vào `otplib`. Đã tự viết lại toàn bộ logic sinh mã và xác thực TOTP dựa trên module `crypto` gốc của Node.js vào file `backend/src/utils/totp.js` (chuẩn 30 giây, 6 số).
- **Áp dụng:** Cập nhật `employee.controller.js` và `attendance.controller.js` để dùng bộ công cụ TOTP custom. Test thành công 100%.

### 7. Tối ưu UX/UI (Trang Profile & Settings)
- **Cải tiến UX Mã QR:** Trang cá nhân (MyQRCode) giờ tự động dừng khi đếm về 0, làm mờ ảnh QR và hiện nút "Tạo mã mới" thay vì load API vô tội vạ.
- **Đồng bộ Layout Trang Cài đặt:** Xóa các giới hạn `max-w-md` cứng nhắc, chuyển sang cấu trúc `grid-cols-2` hiển thị full màn hình cực kỳ thoáng đãng.
- **Đồng bộ Layout Trang Cá nhân:**
  - Quy hoạch lại thành 1 cột duy nhất theo thứ tự: Thông tin cá nhân -> Đổi mật khẩu -> Mã QR (căn giữa).
  - Loại bỏ các class `max-w-2xl` và `max-w-sm` bó buộc form, giúp nội dung tự động mở rộng (full-width) vừa khớp với thẻ Card bao ngoài rất đẹp.

### 8. Nâng cấp tính năng Import Excel
- **Bổ sung cột "Vai trò":** 
  - Hỗ trợ nhập trực tiếp phân quyền (admin, hr, manager, employee) ngay từ file Excel `Mau_Import_Nhan_Vien.xlsx` (cột thứ 11).
  - Tự động validate dữ liệu, nếu nhập sai vai trò sẽ tự động fallback về `employee` kèm log cảnh báo chi tiết, chống lỗi cấp quyền bừa bãi.
  - Sửa backend (`employee.controller.js`) tự động insert vào bảng `users` với đúng role tương ứng.

---

## ⏳ NHỮNG GÌ CHƯA LÀM (HOẶC CẦN KIỂMẾ TIẾP)

### 1. Rà soát các trang khác xem có bị lỗi Hardcode Role không
- Vì trang `/users` đã bị dính lỗi hardcode `user.role !== "admin"`, có khả năng các trang khác (như trang Danh sách nhân viên, Phòng ban, Hợp đồng, Báo cáo) cũng đang bị dính logic đá văng tương tự.
- **Hành động tiếp theo:** Cần quét qua các file `page.tsx` khác trong thư mục `frontend/app/` để thay đổi thành `hasPermission(...)` nhằm đảm bảo hệ thống phân quyền hoạt động nhất quán.

### 2. Các module đang code dang dở (Dựa trên file đang mở)
- **Báo cáo (`reports-panel.tsx`):** Tính năng xuất báo cáo có vẻ đang được xây dựng hoặc cần tích hợp thêm logic.
- **Yêu cầu cập nhật hồ sơ (`profileRequest.routes.js`):** Luồng duyệt/từ chối yêu cầu đổi thông tin cá nhân của nhân viên có thể cần được test lại để đảm bảo hoạt động trơn tru.
