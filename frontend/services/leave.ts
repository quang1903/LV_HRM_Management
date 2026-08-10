import api from "./api"
export const leaveService = {
  getAll: () => api.get("/leaves"),
  getById: (id: number) => api.get(`/leaves/${id}`),
  create: (data: any) => api.post("/leaves", data),
  approve: (id: number) => api.patch(`/leaves/${id}/approve`),
  reject: (id: number, data: any) => api.patch(`/leaves/${id}/reject`, data),
  getBalance: () => api.get("/leaves/balance"),
}