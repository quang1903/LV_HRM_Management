import api from "./api"
export const departmentService = {
  getAll: () => api.get("/departments"),
  getById: (id: number) => api.get(`/departments/${id}`),//Lấy chi tiết 1 phòng ban
  create: (data: any) => api.post("/departments", data),
  update: (id: number, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`),
}