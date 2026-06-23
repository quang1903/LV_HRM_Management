import api from "./api"
export const positionService = {
  getAll: () => api.get("/positions"),
  getByDepartment: (departmentId: number) => api.get(`/positions/department/${departmentId}`),
  create: (data: any) => api.post("/positions", data),
  update: (id: number, data: any) => api.put(`/positions/${id}`, data),
  delete: (id: number) => api.delete(`/positions/${id}`),
}