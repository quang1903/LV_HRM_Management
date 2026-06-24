# Ghi chú tiến độ công việc (Device Lock, Profile & Profile Requests)
Ngày cập nhật: 24/06/2026

## 1. Những việc ĐÃ LÀM THÀNH CÔNG (Đã code xong)

**Tính năng Khóa Thiết Bị (Device Lock):**
- ✅ Cập nhật `settings.controller.js` (Backend): Thêm trường `device_lock_enabled` vào cấu hình và tạo API `updateDeviceLock` tách biệt để bật tắt riêng.
- ✅ Cập nhật `auth.controller.js` và `auth.middleware.js` (Backend): 
  - Thêm logic lấy trạng thái Device Lock từ bảng `settings`.
  - Chặn đăng nhập từ thiết bị lạ (vá lỗ hổng bypass khi không truyền `X-Device-Id`).
  - Thêm logic Miễn trừ cho quyền `admin` (Admin không bao giờ bị khóa thiết bị).
- ✅ Cập nhật `settings/page.tsx` (Frontend): Gắn thêm UI nút bật/tắt (Toggle) Khóa thiết bị kết nối API mượt mà.

**Tính năng Trang cá nhân (Profile) & Đổi mật khẩu:**
- ✅ Cập nhật `AuthContext.tsx`: Cấp quyền truy cập route `/profile` cho tất cả các role (admin, hr, manager, employee).
- ✅ Cập nhật `sidebar.tsx`: Gắn menu "Trang cá nhân" với icon `UserCircle`.
- ✅ Xây dựng `change-password-form.tsx` và API backend (`auth.routes.js`, `changePassword` controller) để hỗ trợ đổi mật khẩu.
- ✅ Xây dựng `my-profile-info.tsx`: Component hiển thị thông tin nhân viên, cho phép cập nhật Số điện thoại và Địa chỉ cá nhân.
- ✅ Tạo trang `profile/page.tsx`: Gộp các mảnh giao diện (Thông tin, Đổi mật khẩu, Mã QR) lại thành 1 trang hoàn chỉnh.

**Tính năng Yêu cầu thay đổi thông tin (Profile Requests):**
- ✅ **Database:** Đã tạo bảng `profile_change_requests` (Xử lý trực tiếp qua PHPMyAdmin bằng lệnh SQL).
- ✅ **Backend API:** Tạo `profileRequest.controller.js` và `profileRequest.routes.js` xử lý luồng tạo yêu cầu, lấy danh sách, duyệt (`approve`) và từ chối (`reject`). Đã đăng ký route thành công vào `index.js`.
- ✅ **Frontend Yêu Cầu:** Nâng cấp `my-profile-info.tsx` cho phép Nhân viên gửi yêu cầu sửa SĐT/Địa chỉ thay vì lưu thẳng, đồng thời hiển thị lịch sử gửi yêu cầu kèm trạng thái (Chờ duyệt / Đã duyệt / Từ chối).
- ✅ **Frontend Duyệt:** Xây dựng trang `/profile-requests` dành riêng cho Admin/HR để quản lý toàn bộ yêu cầu, có chức năng ghi chú lý do khi từ chối.
- ✅ **Phân quyền & Menu:** Gắn mục "Yêu cầu thay đổi" vào `sidebar.tsx` và cấu hình phân quyền chỉ Admin, HR mới được truy cập trong `AuthContext.tsx`.

---

## 2. Những việc CHỜ XỬ LÝ
- ⏳ **Commit & Push Git:**
  - Chưa chạy các lệnh lưu lịch sử Git. Sẽ thực hiện lưu code ngay sau khi toàn bộ quy trình test hoàn tất và hoạt động trơn tru.

---

## 3. Những việc CẦN ANH KIỂM TRA (Test Case)

Anh cần tự tay test lại các kịch bản sau trên trình duyệt để đảm bảo hệ thống an tâm 100%:

- [ ] **Kiểm tra luồng Gửi yêu cầu:** Dùng acc Nhân viên vào "Trang cá nhân", sửa SĐT -> Bấm "Gửi yêu cầu". Bảng lịch sử hiện "Chờ duyệt" là đúng.
- [ ] **Kiểm tra luồng Duyệt (Admin/HR):** Dùng acc Admin/HR vào menu "Yêu cầu thay đổi", bấm "Duyệt" -> Check xem thông tin Nhân viên đã đổi SĐT mới chưa.
- [ ] **Kiểm tra luồng Từ chối:** Thử tạo yêu cầu khác, bên Admin bấm "Từ chối" và ghi lý do. Bên Nhân viên sẽ thấy trạng thái "Từ chối" kèm lý do.
- [ ] **Test phân quyền Profile:** Đăng nhập bằng 1 tài khoản nhân viên thường (không phải admin), bấm vào menu "Trang cá nhân" xem nó có cho vào không, hay báo lỗi/mất menu.
- [ ] **Test Đổi mật khẩu:** Đổi thử pass một tài khoản, đăng xuất, dùng pass mới login lại.
- [ ] **Test Bypass Device Lock:** Bật khóa thiết bị -> Login acc Employee -> Mở tab Ẩn danh login lại acc đó -> Báo lỗi thiết bị (Đúng).
- [ ] **Test Miễn trừ Admin:** Bật khóa thiết bị -> Login acc Admin -> Mở tab Ẩn danh login lại acc Admin -> Vẫn vào bình thường (Đúng).
