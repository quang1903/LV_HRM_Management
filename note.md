# Nhật ký công việc (LV_HRM_Management)

## ✅ Những gì ĐÃ LÀM ĐƯỢC

1. **Sửa lỗi logic gán quyền Manager khi Import file Excel**
   - File: `backend/src/controllers/employee.controller.js`
   - Chi tiết: Ngăn chặn việc tự động gán quyền `manager` cho nhân viên mới import nếu phòng ban đó đã có Trưởng phòng. Xử lý logic gán quyền chính xác trước khi tạo User.

2. **Đồng bộ phân quyền (Role) 2 chiều giữa User và Department**
   - File: `backend/src/controllers/user.controller.js`, `backend/src/controllers/department.controller.js`
   - Chi tiết:
     - Khi Admin hạ quyền của một Trưởng phòng xuống Employee -> Hệ thống tự động xóa `manager_id` của phòng ban đó.
     - Khi Admin chỉ định người khác làm Trưởng phòng -> Tự động nâng quyền (Role) người mới lên `manager` và hạ quyền người cũ xuống `employee` (nếu người cũ không quản lý phòng nào khác).

3. **Hiển thị thông tin "Quản lý phòng ban nào" tại danh sách Tài khoản**
   - File: `backend/src/controllers/user.controller.js`, `frontend/components/hrm/user-table.tsx`
   - Chi tiết: API trả về thêm trường `managing_department_name`. Cập nhật giao diện để User Table hiển thị trạng thái "QL: [Tên phòng]" đối với những người dùng có Role Manager.

4. **Vá lỗi bảo mật (IDOR) phân quyền xem/duyệt Đơn nghỉ phép**
   - File: `backend/src/controllers/leave.controller.js`
   - Chi tiết: 
     - Sửa `getLeaves` để Manager chỉ nhìn thấy đơn nghỉ phép của nhân viên thuộc phòng ban mình.
     - Sửa `approveLeave` & `rejectLeave` để chặn các nỗ lực duyệt/từ chối đơn của nhân viên khác phòng, ngăn chặn leo thang đặc quyền.

5. **Sửa lỗi hiển thị sai số ngày phép (total_days)**
   - File: `frontend/components/hrm/leave-table.tsx`
   - Chi tiết: Gọi tính toán lại số ngày `total_days` ở sự kiện `onChange` trên cả input "Từ ngày" và "Đến ngày", giúp state không bị lỗi Invalid Date khi thao tác.

6. **Tối ưu UX nút Xuất file Excel Nhân viên**
   - File: `frontend/components/hrm/employee-table.tsx`
   - Chi tiết: Gom 2 nút xuất rời rạc thành 1 nút Dropdown duy nhất ("Xuất đang hiển thị" và "Xuất tất cả"), tự code bằng React State và Tailwind CSS gọn nhẹ không cần viện đến thư viện bên thứ 3.

7. **Vá lỗi Middleware chặn trang công khai**
   - File: `frontend/middleware.ts`
   - Chi tiết: Cấu hình đưa đường dẫn `/scan` vào whitelist để máy chấm công bằng khuôn mặt có thể truy cập hoàn toàn công khai mà không bị bắt redirect về `/login`.

---

## ⏳ Những gì CHƯA LÀM (Các hướng có thể cải thiện/kiểm tra thêm)

1. **Testing toàn diện cho các case chuyển phòng ban**: Cần rà soát khi Admin đổi phòng ban của một nhân viên đang là Trưởng phòng sang phòng mới thì cơ chế tháo quyền `manager` hiện tại đã cover đủ chặt chẽ chưa.
2. **Kiểm tra kỹ lại các Route bảo mật khác**: Ngoài module Nghỉ phép, còn module Báo cáo hoặc Lương thưởng (nếu có) cũng cần phân quyền rạch ròi theo cấp Quản lý trực tiếp.
3. **Phân trang (Pagination) cho dữ liệu Excel**: Hiện tại Xuất Excel "Tất cả" load toàn bộ dữ liệu, sau này nếu database lên đến 10,000+ nhân viên có thể cần làm api stream file từ backend thay vì fetch array ở frontend để tránh đứng trình duyệt.
