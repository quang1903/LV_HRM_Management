import api from "./api"
export const profileRequestService = {
  create: (field_name: string, new_value: string) => api.post("/profile-requests", { field_name, new_value }),
  getMy: () => api.get("/profile-requests/my"),
  getAll: (status?: string) => api.get("/profile-requests", { params: status ? { status } : {} }),
  approve: (id: number) => api.patch(`/profile-requests/${id}/approve`),
  reject: (id: number, reason?: string) => api.patch(`/profile-requests/${id}/reject`, { reject_reason: reason }),
}
