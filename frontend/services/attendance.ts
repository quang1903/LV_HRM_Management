import api from "./api"
export const attendanceService = {
  getAll: (params?: any) => api.get("/attendances", { params }),//Lấy bảng lịch sử chấm công (có thể lọc theo tháng, năm, phòng ban)
  getById: (id: number) => api.get(`/attendances/${id}`),//Xem chi tiết 1 bản ghi chấm công
  create: (data: any) => api.post("/attendances", data),//Tạo bản ghi chấm công thủ công (dùng cho Admin/HR sửa giờ)
  update: (id: number, data: any) => api.put(`/attendances/${id}`, data),//Cập nhật 1 bản ghi chấm công (sửa giờ)
  selfCheckIn: (lat: number, lng: number) => api.post("/attendances/self-checkin", { latitude: lat, longitude: lng }),//Nhân viên tự checkin tại chỗ
  selfCheckOut: (lat: number, lng: number) => api.post("/attendances/self-checkout", { latitude: lat, longitude: lng }),//Nhân viên tự checkout tại chỗ
}