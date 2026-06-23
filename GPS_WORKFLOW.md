# TOÀN BỘ QUY TRÌNH CHẤM CÔNG GPS (Tài liệu tham khảo cho Phản biện)

Quy trình này giải thích cách hệ thống Chấm công bằng GPS hoạt động, bao gồm 6 bước khép kín từ lúc Admin cấu hình cho đến lúc hệ thống nhả kết quả báo cáo.

### 1️⃣ Admin cài đặt vị trí công ty (1 lần duy nhất)
- Admin đăng nhập → `/settings` → Bấm "Lấy vị trí hiện tại"
- Browser hỏi quyền GPS → Allow
- Tự điền: `company_lat = 10.7625`, `company_lng = 106.6601`
- Bấm Lưu → Lưu vào bảng `settings` trong Database

### 2️⃣ Nhân viên chấm công vào
- Nhân viên đăng nhập → Dashboard → thấy card "Chấm công hôm nay"
- Bấm "Chấm công vào"
- Browser lấy vị trí hiện tại của NV: VD `lat=10.7626`, `lng=106.6602`
- Gửi lên server: `POST /api/attendances/self-checkin {latitude, longitude}`

### 3️⃣ Backend xử lý
1. Lấy `company_lat`, `company_lng` từ bảng `settings`.
2. Tính khoảng cách giữa vị trí NV và vị trí công ty bằng **công thức Haversine**.
   → VD: khoảng cách = 15 mét
3. So sánh với `max_distance` (VD: 500m)
   → 15m < 500m → HỢP LỆ
4. Kiểm tra giờ hiện tại:
   → Nếu trước 8:30 → status = "Dung gio"
   → Nếu sau 8:30 → status = "Di tre"
5. Thực hiện `INSERT` vào bảng `attendances`: `employee_id`, `work_date`=hôm nay, `check_in`=giờ hiện tại, `status`.
6. Trả về: `{message: "Check-in thành công", status: "Dung gio"}`

### 4️⃣ Frontend hiện kết quả
- Hệ thống hiển thị: *"Check-in thành công! Đúng giờ ✅"*

### 5️⃣ Nhân viên chấm công ra (cuối ngày)
- Bấm "Chấm công ra" → lấy GPS → gửi lên server.
- Backend tìm bản ghi `check_in` gần nhất CHƯA có `check_out` của NV này.
- Tính `work_minutes` = (giờ hiện tại - giờ check_in).
- `UPDATE` `check_out`, `work_minutes` vào bản ghi đó.
- Trả về: *"Check-out thành công! Tổng giờ làm: 8h30p"*

### 6️⃣ Admin/HR xem báo cáo
- Vào trang Chấm công → thấy bảng dữ liệu được cập nhật theo thời gian thực:
| Nhân viên | Check-in | Check-out | Giờ làm | Trạng thái |
|---|---|---|---|---|
| Pham My Dung | 08:05 | 17:35 | 9h30p | Đúng giờ |

---

## TRƯỜNG HỢP TỪ CHỐI (Ngoài phạm vi)
- Nhân viên ở nhà bấm "Chấm công vào"
- Vị trí NV: cách công ty 3.2km
- Backend tính: `distance` = 3200m > `max_distance` (500m)
- Trả về lỗi 403: *"Bạn đang ở ngoài phạm vi công ty (3200m)"*
- Frontend hiện: *"❌ Bạn đang ở ngoài phạm vi công ty (3200m)"*
- **KHÔNG** ghi nhận chấm công.

---

## 🏗️ PHÂN TÍCH KIẾN TRÚC: SO SÁNH 2 PHƯƠNG ÁN CHẤM CÔNG QR

Để hệ thống hoàn thiện và chống gian lận tuyệt đối, dưới đây là bản phân tích lựa chọn phương án quét QR để áp dụng song song với GPS:

### Phương án 1 — QR xoay ở điện thoại nhân viên, quét bằng máy công ty (CỐ ĐỊNH) 🏆 QUYẾT ĐỊNH CHỌN
- **Luồng:** Nhân viên mở app trên điện thoại → QR tự xoay 10s → Đưa điện thoại lên camera của máy tính/tablet đặt cố định tại cổng. Máy này sẽ kiểm tra mã QR + Vị trí cố định của máy.
- **Ưu điểm vượt trội:**
  1. Đã có sẵn thuật toán mã QR xoay vòng (TOTP 10s) → **Chống triệt để chiêu trò chụp ảnh màn hình** gửi cho người khác quét giùm.
  2. Camera máy quét được đặt cố định tại cổng công ty → **Vị trí luôn chính xác 100%**, không cần phụ thuộc vào cảm biến GPS của điện thoại nhân viên (vốn hay bị nhiễu, lệch 10-50m, hoặc bị nhân viên dùng app Fake GPS).
- **Nhược điểm (nhỏ):** Đòi hỏi điện thoại nhân viên phải có pin và có mạng để lấy mã QR. Nhưng ưu điểm bảo mật lấn át hoàn toàn nhược điểm này.

### Phương án 2 — Máy công ty hiện QR tĩnh, nhân viên quét bằng điện thoại (BỊ LOẠI)
- **Luồng:** Màn hình tại cổng hiển thị 1 mã QR tĩnh (đại diện cho cổng đó). Nhân viên dùng điện thoại bật Camera lên quét → App điện thoại gửi mã NV + tọa độ GPS của điện thoại lên Server.
- **Lỗ hổng chết người:** Mã QR hiển thị trên máy công ty là mã tĩnh (không thể xoay vòng vì nó chỉ đại diện cho một địa điểm cụ thể, không đại diện cho người dùng). Nếu ai đó **chụp ảnh cái mã QR tĩnh** này rồi gửi qua Zalo cho một đồng nghiệp đang ở nhà, người đồng nghiệp đó chỉ cần dùng tool Fake GPS (giả lập tọa độ về công ty) và quét tấm ảnh tĩnh kia là có thể ngồi nhà "chấm công khống".
- **Kết luận:** Mất đi hoàn toàn ý nghĩa "Bắt buộc phải có mặt tại công ty".

> **ĐÁNH GIÁ CHUNG:** Phương án 1 vượt trội hoàn toàn về mặt an toàn thông tin (Security). Mã QR phải là thứ xoay vòng và thuộc về từng cá nhân (để định danh người dùng theo thời gian thực), còn thiết bị quét phải là thiết bị cố định (để định danh không gian địa lý không thể làm giả).
