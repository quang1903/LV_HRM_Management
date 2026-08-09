import api from "./api"
export const positionService = {
  getAll: () => api.get("/positions"),
  getByDepartment: (departmentId: number) => api.get(`/positions/department/${departmentId}`),//Lấy danh sách chức vụ thuộc 1 phòng ban cụ thể
  create: (data: any) => api.post("/positions", data),
  update: (id: number, data: any) => api.put(`/positions/${id}`, data),
  delete: (id: number) => api.delete(`/positions/${id}`),
}