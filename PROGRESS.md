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
---

## ⏳ NHỮNG GÌ CHƯA LÀM (HOẶC CẦN KIỂMẾ TIẾP)

### 1. Rà soát các trang khác xem có bị lỗi Hardcode Role không
- Vì trang `/users` đã bị dính lỗi hardcode `user.role !== "admin"`, có khả năng các trang khác (như trang Danh sách nhân viên, Phòng ban, Hợp đồng, Báo cáo) cũng đang bị dính logic đá văng tương tự.
- **Hành động tiếp theo:** Cần quét qua các file `page.tsx` khác trong thư mục `frontend/app/` để thay đổi thành `hasPermission(...)` nhằm đảm bảo hệ thống phân quyền hoạt động nhất quán.

### 2. Các module đang code dang dở (Dựa trên file đang mở)
- **Báo cáo (`reports-panel.tsx`):** Tính năng xuất báo cáo có vẻ đang được xây dựng hoặc cần tích hợp thêm logic.
- **Yêu cầu cập nhật hồ sơ (`profileRequest.routes.js`):** Luồng duyệt/từ chối yêu cầu đổi thông tin cá nhân của nhân viên có thể cần được test lại để đảm bảo hoạt động trơn tru.
