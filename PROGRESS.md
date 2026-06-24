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

---

## ⏳ NHỮNG GÌ CHƯA LÀM (HOẶC CẦN KIỂMẾ TIẾP)

### 1. Rà soát các trang khác xem có bị lỗi Hardcode Role không
- Vì trang `/users` đã bị dính lỗi hardcode `user.role !== "admin"`, có khả năng các trang khác (như trang Danh sách nhân viên, Phòng ban, Hợp đồng, Báo cáo) cũng đang bị dính logic đá văng tương tự.
- **Hành động tiếp theo:** Cần quét qua các file `page.tsx` khác trong thư mục `frontend/app/` để thay đổi thành `hasPermission(...)` nhằm đảm bảo hệ thống phân quyền hoạt động nhất quán.

### 2. Các module đang code dang dở (Dựa trên file đang mở)
- **Quản lý Nhân viên (`employee-table.tsx`, `employee.controller.js`):** Có thể cần bổ sung hoặc tối ưu thêm logic phân quyền cho Manager (ví dụ: Manager chỉ được xem nhân viên thuộc phòng ban của mình).
- **Báo cáo (`reports-panel.tsx`):** Tính năng xuất báo cáo có vẻ đang được xây dựng hoặc cần tích hợp thêm logic.
- **Yêu cầu cập nhật hồ sơ (`profileRequest.routes.js`):** Luồng duyệt/từ chối yêu cầu đổi thông tin cá nhân của nhân viên có thể cần được test lại để đảm bảo hoạt động trơn tru.

### 3. Phân quyền chi tiết (Row-level security) ở Backend
- Hiện tại Middleware Frontend và Route Backend đã chặn quyền ở cấp độ Trang (Page-level). Tuy nhiên, cần kiểm tra xem Backend đã chặn việc Manager chỉnh sửa nhân viên khác phòng ban chưa, hay Manager có đang xem được dữ liệu toàn công ty không.
