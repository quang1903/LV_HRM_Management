import api from "./api"
export const profileRequestService = {
  create: (field_name: string, new_value: string) => api.post("/profile-requests", { field_name, new_value }),//Gửi yêu cầu thay đổi 1 trường thông tin
  getMy: () => api.get("/profile-requests/my"),//Lấy lịch sử các yêu cầu thay đổi của cá nhân nhân viên đó
  getAll: (status?: string) => api.get("/profile-requests", { params: status ? { status } : {} }),//Lấy tất cả yêu cầu thay đổi(dành cho admin/hr)
  approve: (id: number) => api.patch(`/profile-requests/${id}/approve`),//Phê duyệt yêu cầu thay đổi
  reject: (id: number, reason?: string) => api.patch(`/profile-requests/${id}/reject`, { reject_reason: reason }),//Từ chối yêu cầu thay đổi
}
