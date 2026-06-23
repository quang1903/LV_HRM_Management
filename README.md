# HRM Pro - Hệ thống Quản lý Nhân sự

## 🚀 Tech Stack
- **Frontend**: Next.js 16 + TypeScript + Tailwind + shadcn/ui
- **Backend**: Node.js + Express + MySQL
- **Database**: Clever Cloud MySQL (cloud)
- **Deploy**: Vercel (frontend) + Render (backend)

## 🌐 Links
- Frontend: https://trannhutquang.io.vn
- Backend: https://hrm-backend-dg5o.onrender.com

---

## ✅ ĐÃ HOÀN THÀNH

### Dashboard
- Stat cards từ API thật
- Activity panel từ API thật
- HĐ sắp hết hạn

### Nhân viên
- Xem danh sách đang làm / đã nghỉ
- Thêm (mã tự generate, chọn phòng ban + chức vụ, validate email)
- Sửa thông tin + đổi chức vụ (chỉ khi đang làm)
- Xem chi tiết
- Cho nghỉ việc (soft delete, tự động khóa tài khoản)
- Kích hoạt lại (tự động mở tài khoản)
- Xóa chính thức (admin only, chỉ NV đã nghỉ, xóa cả tài khoản)
- Thêm NV tự động tạo tài khoản (password mặc định: 123456)

### Phòng ban
- Xem / Thêm / Sửa / Xóa
- Chọn trưởng phòng từ danh sách NV

### Chấm công
- Xem theo tháng/năm
- Thêm / Sửa (admin + hr)
- Stat cards
- Employee chỉ xem của mình

### Nghỉ phép
- Xem / Gửi đơn / Duyệt / Từ chối
- Tự tính số ngày
- Xem lý do từ chối
- Admin + Manager duyệt
- Employee chỉ xem đơn của mình
- Phân trang

### Hợp đồng
- Xem / Thêm / Gia hạn / Chấm dứt
- Không cho gia hạn ngày quá khứ
- Tự tính trạng thái theo ngày thực tế
- Lọc theo trạng thái

### Báo cáo
- 4 tab: Chấm công / Phòng ban / Nghỉ phép / Hợp đồng
- Lọc theo tháng/năm

### Người dùng
- Xem / Tạo / Đổi role / Kích hoạt / Đặt lại mật khẩu
- Gắn tài khoản với nhân viên

### Phân quyền
- Admin: toàn quyền
- HR: quản lý NV, phòng ban, chấm công, xem báo cáo
- Manager: xem + duyệt nghỉ phép
- Employee: xem cá nhân + gửi đơn nghỉ phép

---

## ⏳ CHƯA LÀM

- [ ] Xuất Excel thật (báo cáo)

---

## 🔜 SẼ LÀM (Hướng phát triển)

- [ ] Tính lương tự động
- [ ] Thông báo realtime khi có đơn nghỉ phép mới
- [ ] Quản lý ca làm việc
- [ ] Upload avatar nhân viên
- [ ] QR code chấm công
- [ ] Trang cá nhân nhân viên
- [ ] Đổi mật khẩu cá nhân

---

## 🔑 Tài khoản demo
| Email | Password | Role |
|-------|----------|------|
| admin@hrm.com | 123456 | Admin |
| hr@hrm.com | 123456 | HR |
| manager@hrm.com | 123456 | Manager |
| nv001@hrm.com | 123456 | Employee |