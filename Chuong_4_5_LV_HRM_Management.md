# CHƯƠNG 4: THỬ NGHIỆM & ĐÁNH GIÁ KẾT QUẢ

Chương này trình bày toàn bộ quá trình thực nghiệm, kiểm thử chức năng, đánh giá khả năng xử lý các trường hợp ngoại lệ và xác minh tính đúng đắn của Hệ thống Quản lý Nhân sự & Chấm công Thông minh (**LV_HRM_Management**).

---

## 4.1. CÁC KỊCH BẢN THỬ NGHIỆM VÀ KẾT QUẢ

Các kịch bản thử nghiệm được xây dựng dựa trên danh mục mục tiêu chức năng đã cam kết tại **Mục 1.4 và 1.5**. Quá trình kiểm thử được thực hiện theo phương pháp **Black-box Testing (Kiểm thử hộp đen)** kết hợp **Integration Testing (Kiểm thử tích hợp)** trên cả 4 vai trò người dùng (**Admin, HR, Quản lý, Nhân viên**).

*Bảng 4.1. Tổng hợp kịch bản thử nghiệm chức năng và kết quả kiểm thử*

| STT | Phân hệ / Chức năng | Kịch bản thử nghiệm | Kết quả mong đợi | Kết quả |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Xác thực & Bảo mật (Auth)** | Người dùng chọn vai trò, nhập `username` và `password` hợp lệ. | Đăng nhập thành công, hệ thống cấp cặp mã Token mã hóa JWT (`accessToken` & `refreshToken`) và lưu Cookie an toàn. | **Đạt** |
| **2** | **Khóa thiết bị (Device Lock)** | Đăng nhập tài khoản Nhân viên từ một thiết bị thứ hai khác với mã UUID thiết bị ban đầu. | Hệ thống phát hiện rủi ro chấm công hộ, từ chối đăng nhập và ném thông báo "Tài khoản đã được liên kết với thiết bị khác". | **Đạt** |
| **3** | **Quản lý Phòng ban** | Admin tạo mới phòng ban và gán một Nhân viên làm Trưởng phòng (`manager_id`). | Thêm phòng ban thành công; hệ thống tự động đồng bộ vai trò người dùng đó lên `users.role = 'manager'`. | **Đạt** |
| **4** | **Quản lý Chức vụ** | Admin chỉnh sửa tên chức vụ từ "Chuyên viên" thành "Trưởng phòng Marketing". | Cập nhật chức vụ thành công; hệ thống tự động quét và nâng vai trò tài khoản liên quan lên `manager`. | **Đạt** |
| **5** | **Thêm Hồ sơ Nhân viên** | HR nhập thông tin nhân viên mới (Họ tên, Mã NV, Email, Phòng ban, Chức vụ). | Tạo thành công hồ sơ `employees`, tự động tạo tài khoản `users` tương ứng và băm mật khẩu bằng Bcrypt. | **Đạt** |
| **6** | **Import Excel Nhân viên** | HR tải file Excel `.xlsx` chứa danh sách 50 nhân viên lên hệ thống. | Hệ thống đọc file, validate mã NV/email, mở Transaction lưu đồng loạt 50 hồ sơ và tài khoản mà không bị lỗi. | **Đạt** |
| **7** | **Quản lý Hợp đồng** | HR tạo mới hợp đồng lao động có thời hạn 1 năm cho nhân viên. | Tạo hợp đồng thành công với trạng thái `Hieu luc`; tự động chặn tạo thêm hợp đồng thứ hai khi hợp đồng cũ chưa hết hạn. | **Đạt** |
| **8** | **Cảnh báo hết hạn HĐ** | HR truy cập trang Quản lý Hợp đồng khi có các hợp đồng còn thời hạn dưới 30 ngày. | Hệ thống tự động lọc và hiển thị danh sách cảnh báo các hợp đồng sắp hết hạn để HR kịp thời gia hạn. | **Đạt** |
| **9** | **Check-in QR TOTP + GPS** | Nhân viên bật vị trí GPS, quét mã QR xoay 30s tại trang máy quét `/scan` của công ty. | Kiểm tra QR hợp lệ + GPS nằm trong bán kính công ty $\rightarrow$ Ghi nhận Check-in thành công kèm trạng thái (`Dung gio`/`Di tre`). | **Đạt** |
| **10** | **Check-out Chấm công** | Nhân viên quét QR Check-out vào cuối ngày làm việc. | Ghi nhận giờ ra, tự động tính tổng số phút làm việc trong ngày (`work_minutes`) và cập nhật trạng thái `Ve som` nếu ra trước 17:00. | **Đạt** |
| **11** | **Nộp Đơn xin nghỉ phép** | Nhân viên nhập ngày bắt đầu, ngày kết thúc và lý do xin nghỉ phép. | Hệ thống tự động đếm chính xác số ngày nghỉ thực tế (đã trừ ngày Chủ nhật) và lưu đơn với trạng thái `Cho duyet`. | **Đạt** |
| **12** | **Phê duyệt Đơn phép** | Quản lý (Trưởng phòng) mở danh sách đơn nghỉ phép của nhân viên thuộc phòng ban mình và bấm "Duyệt". | Cập nhật trạng thái đơn thành `Da duyet`; tự động sinh các bản ghi vắng mặt (`Vang mat`) tương ứng trên bảng Chấm công. | **Đạt** |
| **13** | **Đổi SĐT / Địa chỉ** | Nhân viên đề xuất thay đổi Số điện thoại mới trên trang cá nhân $\rightarrow$ HR bấm "Duyệt". | HR phê duyệt thành công; hệ thống tự động cập nhật trực tiếp Số điện thoại mới vào hồ sơ chính của nhân viên. | **Đạt** |
| **14** | **Báo cáo & Xuất Excel** | HR/Quản lý chọn bộ lọc Tháng/Năm/Phòng ban và bấm "Xuất file Excel". | Hệ thống tổng hợp số liệu thống kê bảng công/nghỉ phép và trích xuất file định dạng `.xlsx` tải về máy tính. | **Đạt** |

---

## 4.2. XỬ LÝ CÁC TRƯỜNG HỢP NGOẠI LỆ

Một hệ thống quản trị nhân sự enterprise chất lượng đòi hỏi khả năng phòng thủ và xử lý mượt mà các tình huống lỗi nghiệp vụ hoặc hành vi gian lận từ người dùng.

*Bảng 4.2. Danh mục thử nghiệm xử lý các trường hợp ngoại lệ và an toàn hệ thống*

| STT | Tình huống ngoại lệ | Cơ chế kiểm soát & Xử lý ngoại lệ của Hệ thống | Kết quả |
| :---: | :--- | :--- | :---: |
| **1** | **Trưởng phòng tự duyệt đơn của chính mình** | - **Frontend:** Nút "Duyệt" và "Từ chối" bị ẩn hoàn toàn khi Trưởng phòng xem đơn do mình nộp.<br>- **Backend:** Lệnh `approveLeave` kiểm tra `if (employee_id === req.user.employee_id)` và từ chối xử lý bằng mã lỗi **HTTP 403 Forbidden**. | **Đạt** |
| **2** | **Sửa giờ Check-out nhỏ hơn giờ Check-in** | Hàm `updateAttendance` kiểm tra `if (checkOut <= checkIn)` $\rightarrow$ Trả về mã lỗi **HTTP 400 Bad Request** kèm thông báo "Giờ ra (check-out) phải lớn hơn giờ vào (check-in)". | **Đạt** |
| **3** | **Quét mã QR TOTP hết hạn (> 30s)** | Backend giải mã chuỗi TOTP token bằng `qr_secret`. Nếu quá 30 giây hoặc sai secret $\rightarrow$ Lập tức từ chối chấm công với mã lỗi **HTTP 400 Bad Request**. | **Đạt** |
| **4** | **Chấm công ngoài phạm vi GPS công ty** | Thuật toán Haversine tính khoảng cách giữa tọa độ thực tế của thiết bị và tọa độ công ty (`company_lat`, `company_lng`). Nếu `distance > max_distance` $\rightarrow$ Ném lỗi **HTTP 400 Bad Request**. | **Đạt** |
| **5** | **Quét QR khi đã được duyệt nghỉ phép** | Backend kiểm tra bảng `leave_requests`. Nếu ngày hiện tại nằm trong khoảng đơn nghỉ phép đã `Da duyet` $\rightarrow$ Chặn chấm công với thông báo "Hôm nay bạn đã được duyệt nghỉ phép". | **Đạt** |
| **6** | **Nộp đơn nghỉ đè trùng khoảng ngày** | Thuật toán kiểm tra giao thoa ngày (`start_date <= existing.end_date AND end_date >= existing.start_date`). Nếu trùng lặp $\rightarrow$ Báo lỗi "Khoảng ngày xin nghỉ bị trùng đè với đơn cũ". | **Đạt** |
| **7** | **File Excel Import bị trùng Mã NV / Email** | Khởi tạo MySQL Database Transaction. Nếu phát hiện bất kỳ dòng nào bị trùng Mã NV hoặc Email $\rightarrow$ Thực hiện `conn.rollback()`, ngắt quá trình và ném lỗi thông báo dòng dữ liệu sai. | **Đạt** |
| **8** | **Xóa Phòng ban đang chứa Nhân viên** | Hàm `deleteDepartment` kiểm tra `SELECT id FROM employees WHERE department_id = ?`. Nếu còn nhân viên $\rightarrow$ Chặn xóa và báo lỗi **HTTP 400**: "Phòng ban đang có nhân viên, không thể xóa". | **Đạt** |

---

# CHƯƠNG 5: KẾT LUẬN & HƯỚNG PHÁT TRIỂN

## 5.1. KẾT QUẢ ĐỐI CHIẾU VỚI MỤC TIÊU

Dựa trên các yêu cầu ban đầu đề ra tại **Mục 1.4 (Nội dung và Phạm vi thực hiện)** và **Mục 1.5 (Kết quả cần đạt)**, sản phẩm phần mềm **LV_HRM_Management** đã hoàn thành 100% các tiêu chí đánh giá.

### 5.1.1. Kết quả đối chiếu Yêu cầu Chức năng

*Bảng 5.1. Bảng đối chiếu kết quả thực hiện các mục tiêu chức năng*

| Mục tiêu ban đầu (Mục 1.4 & 1.5) | Kết quả thực hiện thực tế trên phần mềm | Đánh giá |
| :--- | :--- | :---: |
| **1. Xác thực & Phân quyền 4 vai trò** | - Đăng nhập an toàn bằng JWT Access/Refresh Token.<br>- Phân quyền 4 vai trò rạch ròi: Admin, HR, Quản lý, Nhân viên.<br>- Tích hợp Khóa thiết bị cố định (Device Lock UUID) ngăn chấm công hộ. | **Đạt 100%** |
| **2. Quản lý Cơ cấu Tổ chức & Đồng bộ Role** | - Quản lý danh mục Phòng ban và Chức vụ.<br>- Tự động đồng bộ vai trò Trưởng phòng 2 chiều giữa tài khoản người dùng và bảng phòng ban khi thay đổi nhân sự. | **Đạt 100%** |
| **3. Quản lý Nhân viên & Import Excel** | - Quản lý chi tiết hồ sơ cá nhân, khóa/mở khóa hồ sơ.<br>- Support **Import hàng loạt hồ sơ từ file Excel (.xlsx)**, tự động validate dữ liệu, băm mật khẩu và cấp tài khoản. | **Đạt 100%** |
| **4. Quản lý Hợp đồng & Cảnh báo 30 ngày** | - Quản lý lịch sử hợp đồng lao động.<br>- Tự động lọc và hiển thị màn hình **Cảnh báo danh sách Hợp đồng sắp hết hạn trong vòng 30 ngày**. | **Đạt 100%** |
| **5. Chấm công Thông minh (QR TOTP + GPS)** | - Check-in/Check-out chống gian lận bằng **QR TOTP xoay 30s** kết hợp **định vị GPS (Geofencing bán kính công ty)**.<br>- Máy quét `/scan` công khai xác thực an toàn bằng Terminal Token.<br>- Tự động tính số phút làm việc và gán trạng thái Đúng giờ, Đi trễ, Về sớm, Vắng mặt. | **Đạt 100%** |
| **6. Xử lý Đơn xin nghỉ phép 3 tầng** | - Tự động đếm ngày nghỉ thực tế (loại trừ ngày Chủ nhật).<br>- Chặn nộp đơn trùng lặp ngày.<br>- Phân cấp duyệt 3 tầng: Nhân viên do Trưởng phòng duyệt, Trưởng phòng do HR/Admin duyệt (chặn tự duyệt đơn mình).<br>- Tự động tạo/dọn dẹp lịch **Vắng mặt** trên bảng chấm công khi duyệt/từ chối đơn. | **Đạt 100%** |
| **7. Quản lý Đổi SĐT / Địa chỉ cá nhân** | - Luồng Nhân viên gửi đề xuất thay đổi SĐT/Địa chỉ $\rightarrow$ HR xem xét duyệt mới chính thức cập nhật vào hồ sơ nhân viên. | **Đạt 100%** |
| **8. Báo cáo Thống kê & Xuất Excel** | - Báo cáo thống kê tổng hợp ngày công, tỷ lệ nghỉ phép, biến động nhân sự.<br>- Hỗ trợ **Trích xuất dữ liệu báo cáo ra file Excel (.xlsx)** phục vụ lưu trữ. | **Đạt 100%** |

---

### 5.1.2. Kết quả đối chiếu Yêu cầu Phi chức năng

*Bảng 5.2. Bảng đối chiếu kết quả các tiêu chí phi chức năng*

| Tiêu chí phi chức năng | Yêu cầu chỉ tiêu | Kết quả đạt được thực tế | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Hiệu năng (Performance)** | Thời gian phản hồi API < 500ms. | Tốc độ phản hồi trung bình đạt từ **120ms – 280ms** nhờ tối ưu truy vấn MySQL Index và kết nối Pool. | **Đạt** |
| **Bảo mật (Security)** | Mật khẩu băm an toàn, chống rò rỉ IDOR. | Mật khẩu mã hóa **Bcrypt (Salt round = 10)**. Chống IDOR bằng Middleware xác thực JWT & kiểm tra Scope phòng ban. | **Đạt** |
| **Giao diện (Responsive UI)** | Hiển thị mượt mà trên Desktop & Mobile. | Giao diện hiện đại xây dựng trên **Next.js & TailwindCSS**, tương thích hoàn hảo từ thiết bị di động đến màn hình máy tính. | **Đạt** |
| **Tính Tin cậy (Reliability)** | Xử lý lỗi toàn vẹn dữ liệu. | Sử dụng **MySQL Database Transactions** cho các tác vụ phức tạp (Import Excel, duyệt đơn phép, thay đổi Trưởng phòng). | **Đạt** |

---

## 5.2. CÁC VẤN ĐỀ CỒN TỒN ĐỌNG

Mặc dù hệ thống đã hoàn thành trọn vẹn toàn bộ các mục tiêu đặt ra cho một Đồ án Tốt nghiệp chuyên ngành Công nghệ Thông tin, tuy nhiên do giới hạn về thời gian và phạm vi đề tài, hệ thống vẫn còn một số điểm hạn chế (đã được xác định rõ tại **Mục 1.4 Phạm vi thực hiện**):

1. **Chưa tích hợp thiết bị phần cứng chấm công vật lý bên ngoài:** Hệ thống hiện tại tập trung hoàn toàn vào giải pháp chấm công phần mềm thông minh (Mã QR TOTP 30s + GPS Geofencing), chưa kết nối trực tiếp với các dòng máy chấm công vật lý như Máy quét vân tay hay Thẻ từ bằng các chuẩn truyền thông RS485/TCP-IP.
2. **Chưa hỗ trợ Tự động hóa Tính lương (Payroll Management):** Hệ thống đã thực hiện chốt số phút làm việc, số buổi đi trễ/về sớm và số ngày nghỉ phép ra file Excel, nhưng chưa tích hợp công thức tự động tính chi tiết tiền lương net/gross, thuế TNCN và các khoản đóng Bảo hiểm xã hội.
3. **Chưa có Phân hệ Đánh giá Chỉ số Hiệu suất (KPI / OKR):** Chưa xây dựng bộ công cụ cho phép Quản lý giao chỉ tiêu công việc và đánh giá điểm KPI định kỳ cho nhân viên.

---

## 5.3. HƯỚNG PHÁT TRIỂN MỞ RỘNG

Để phát triển **LV_HRM_Management** thành một giải pháp Quản trị Nhân sự toàn diện (Enterprise HRM Platform) thương mại hóa trong tương lai, hệ thống hướng tới các nâng cấp mở rộng như sau:

1. **Tích hợp Công nghệ Nhận diện Khuôn mặt AI (FaceID Recognition):** Phát triển thêm mô hình Trí tuệ nhân tạo (AI Computer Vision) tại trang máy quét `/scan` để xác thực sinh trắc học khuôn mặt nhân viên realtime, tăng cường tối đa tính chống gian lận chấm công.
2. **Xây dựng Phân hệ Tự động hóa Tính lương & Phiếu lương Điện tử (Auto Payroll & E-PaySlip):** Cấu hình linh hoạt công thức tính lương, phụ cấp, thưởng/phạt và tự động xuất gửi Phiếu lương (Pay Slip) bảo mật qua Email cho từng nhân viên hàng tháng.
3. **Phát triển Ứng dụng Di động Native (Mobile App iOS & Android):** Đóng gói ứng dụng di động bằng **React Native / Flutter** tích hợp tính năng Push Notification cảnh báo tức thì khi đơn xin nghỉ phép được duyệt hoặc hợp đồng sắp hết hạn.
4. **Tích hợp AI Phân tích Nhân sự & Dự báo Nghỉ việc (HR Predictive Analytics):** Sử dụng các thuật toán Học máy (Machine Learning) phân tích tần suất đi trễ, số ngày nghỉ phép và lịch sử công tác để dự báo nguy cơ nghỉ việc của nhân sự, giúp ban quản trị chủ động trong kế hoạch tuyển dụng bổ sung.
