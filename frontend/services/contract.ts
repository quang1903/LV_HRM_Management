import api from "./api"
export const contractService = {
  getAll: () => api.get("/contracts"),
  getById: (id: number) => api.get(`/contracts/${id}`),
  getExpiring: () => api.get("/contracts/expiring"),//Lấy danh sách hợp đồng sắp hết hạn (trong 30 ngày)
  create: (data: any) => api.post("/contracts", data),
  renew: (id: number, data: any) => api.put(`/contracts/${id}`, data),
  terminate: (id: number) => api.patch(`/contracts/${id}/terminate`),
}