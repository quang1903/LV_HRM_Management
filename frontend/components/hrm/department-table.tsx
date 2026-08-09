"use client"

import { useState, useEffect } from "react"
import { Pencil, Trash2, Search, Plus, X, Users, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { departmentService } from "@/services/department"
import { employeeService } from "@/services/employee"

type Department = {
  id: number
  name: string
  description: string | null
  manager_id: number | null
  manager_name: string | null
  total_employees?: number
}

type Employee = { id: number; full_name: string; employee_code: string; department_id: number | null }

export function DepartmentTable() {

  const { user } = useAuth()
  //xác định xem user có quyền chỉnh sửa
  const canEdit   = user?.role === "admin" || user?.role === "hr"
  //xác định xem user có quyền xóa
  const canDelete = user?.role === "admin"
  //lưu trữ danh sách các phòng ban
  const [departments, setDepartments] = useState<Department[]>([])
  //lưu trữ danh sách nhân viên
  const [employees, setEmployees]     = useState<Employee[]>([])
  //biến kiểm tra trạng thái tải dữ liệu
  const [loading, setLoading]         = useState(true)
  //biến lưu giá trị tìm kiếm
  const [search, setSearch]           = useState("")
  //lưu trữ thông tin phòng ban đang được chỉnh sửa
  const [editDept, setEditDept]       = useState<Department | null>(null)
  //lưu trữ thông tin phòng ban đang được xóa
  const [deleteDept, setDeleteDept]   = useState<Department | null>(null)
  //biến kiểm tra trạng thái hiển thị form thêm phòng ban
  const [showAdd, setShowAdd]         = useState(false)
  //lưu trữ thông tin phòng ban mới đang được nhập
  const [newDept, setNewDept]         = useState({ name: "", description: "", manager_id: "" })

  //Lấy danh sách chức vụ thuộc 1 phòng ban cụ thể
  useEffect(() => {
    fetchDepartments()
    employeeService.getAll()
      .then(res => setEmployees(res.data.filter((e: any) => e.status === "Dang lam")))
      .catch(() => {})
  }, [])

  //Lấy danh sách phòng ban
  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const res = await departmentService.getAll()
      setDepartments(res.data)
    } catch {
      alert("Không thể tải danh sách phòng ban")
    } finally {
      setLoading(false)
    }
  }

  //Lọc danh sách phòng ban theo từ khóa tìm kiếm (Tên phòng hoặc Tên Trưởng phòng)
  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.manager_name?.toLowerCase().includes(search.toLowerCase())
  )

  // Lấy danh sách các nhân viên ĐÃ LÀM Trưởng phòng ở các phòng khác (để tránh 1 người làm Trưởng phòng 2 nơi)
  const usedManagerIds = departments
    .filter(d => d.manager_id)
    .map(d => d.manager_id)

  //HÀM CẬP NHẬT PHÒNG BAN (Sửa tên, Mô tả, Chọn Trưởng phòng)
  const handleEdit = async () => {
    if (!editDept) return
    try {
      await departmentService.update(editDept.id, {
        name:        editDept.name,
        description: editDept.description,
        manager_id:  editDept.manager_id,
      })
      setEditDept(null)
      fetchDepartments()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật phòng ban")
    }
  }

  //HÀM XÓA PHÒNG BAN (Server sẽ chặn nếu phòng ban đang chứa nhân viên)
  const handleDelete = async () => {
    if (!deleteDept) return
    try {
      await departmentService.delete(deleteDept.id)
      setDeleteDept(null)
      fetchDepartments()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa phòng ban")
    }
  }

  //HÀM THÊM PHÒNG BAN MỚI
  const handleAdd = async () => {
    if (!newDept.name) {
      alert("Vui lòng nhập tên phòng ban")
      return
    }
    try {
      await departmentService.create({
        name:        newDept.name,
        description: newDept.description || null,
        manager_id:  newDept.manager_id ? Number(newDept.manager_id) : null,
      })
      setShowAdd(false)
      setNewDept({ name: "", description: "", manager_id: "" })
      fetchDepartments()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi thêm phòng ban")
    }
  }

  //Hiển thị giao diện
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card className="overflow-hidden p-0">
        {/* Thanh tìm kiếm & Nút Thêm phòng ban */}
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          {/* Chức năng tìm kiếm */}
          <div>
            <h2 className="text-base font-semibold">Danh sách phòng ban</h2>
            <p className="text-sm text-muted-foreground">Quản lý các phòng ban trong công ty</p>
          </div>
          {/* Tìm kiếm */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 ring-ring/40 md:w-56"
              />
            </div>
            {/* Nút Thêm phòng ban */}
            {canEdit && (
              <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />Thêm phòng ban
              </Button>
            )}
          </div>
        </div>

        {/* Bảng danh sách phòng ban */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Tên phòng ban</th>
                <th className="px-5 py-3">Trưởng phòng</th>
                <th className="px-5 py-3">Mô tả</th>
                <th className="px-5 py-3 text-right">{canEdit ? "Hành động" : ""}</th>
              </tr>
            </thead>
            {/* Bảng danh sách phòng ban */}
            <tbody className="divide-y divide-border">
              {filtered.map((dept) => (
                <tr key={dept.id} className="transition-colors hover:bg-muted/40">
                  {/* Tên phòng ban */}
                  <td className="px-5 py-4 font-medium">{dept.name}</td>
                  {/* Trưởng phòng */}
                  <td className="px-5 py-4 text-muted-foreground">{dept.manager_name || "Chưa có"}</td>
                  {/* Mô tả */}
                  <td className="px-5 py-4 text-muted-foreground">{dept.description || "—"}</td>
                  {/* Hành động */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <button type="button" onClick={() => setEditDept({ ...dept })} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {/* Nút xóa */}
                      {canDelete && (
                        <button type="button" onClick={() => setDeleteDept(dept)} className="rounded-md p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tổng số phòng ban */}
        <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
          Tổng cộng <span className="font-medium text-foreground">{filtered.length}</span> phòng ban
        </div>
      </Card>

      {/* Modal Sửa */}
      {editDept && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          {/* Hộp thoại sửa phòng ban */}
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Nội dung hộp thoại */}
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              {/* Tiêu đề và nút đóng */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Chỉnh sửa phòng ban</h3>
                <button onClick={() => setEditDept(null)}><X className="h-5 w-5" /></button>
              </div>
              
              {/* Form chỉnh sửa thông tin phòng ban */}
              <div className="flex flex-col gap-3">
                {/* Tên phòng ban */}
                <div>
                  <label className="text-sm text-muted-foreground">Tên phòng ban *</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={editDept.name}
                    onChange={e => setEditDept({ ...editDept, name: e.target.value })}
                  />
                </div>
                {/* Mô tả */}
                <div>
                  <label className="text-sm text-muted-foreground">Mô tả</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={editDept.description || ""}
                    onChange={e => setEditDept({ ...editDept, description: e.target.value })}
                  />
                </div>
                {/* Trưởng phòng */}
                <div>
                  <label className="text-sm text-muted-foreground">Trưởng phòng</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={editDept.manager_id || ""}
                    onChange={e => setEditDept({ ...editDept, manager_id: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">-- Chọn trưởng phòng --</option>
                    {employees
                      .filter(e => 
                        e.department_id === editDept.id && 
                        (!usedManagerIds.includes(e.id) || e.id === editDept.manager_id)
                      )
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditDept(null)}>Hủy</Button>
                <Button className="flex-1" onClick={handleEdit}>Lưu</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {deleteDept && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          {/* Hộp thoại xóa phòng ban */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              {/* Tiêu đề */}
              <h3 className="text-lg font-semibold mb-2">Xác nhận xóa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bạn có chắc muốn xóa phòng ban <span className="font-medium text-foreground">{deleteDept.name}</span>?
              </p>
              {/* Các nút hành động */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteDept(null)}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete}>Xóa</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          {/* Hộp thoại thêm phòng ban */}
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Nội dung hộp thoại */}
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              {/* Tiêu đề */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thêm phòng ban mới</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5" /></button>
              </div>
              
              {/* Form thêm phòng ban */}
              <div className="flex flex-col gap-3">
                {/* Tên phòng ban */}
                <div>
                  <label className="text-sm text-muted-foreground">Tên phòng ban *</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newDept.name}
                    onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                  />
                </div>
                {/* Mô tả */}
                <div>
                  <label className="text-sm text-muted-foreground">Mô tả</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newDept.description}
                    onChange={e => setNewDept({ ...newDept, description: e.target.value })}
                  />
                </div>
                {/* Trưởng phòng */}
                <div>
                  <label className="text-sm text-muted-foreground">Trưởng phòng</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newDept.manager_id}
                    onChange={e => setNewDept({ ...newDept, manager_id: e.target.value })}
                  >
                    <option value="">-- Chọn trưởng phòng (có thể gán sau) --</option>
                    {employees
                      .filter(e => !usedManagerIds.includes(e.id))
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code}) - {(e as any).department_name || "Chưa có phòng"}</option>
                      ))}
                  </select>
                </div>
              </div>
              
              {/* Các nút hành động */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Hủy</Button>
                <Button className="flex-1" onClick={handleAdd}>Thêm</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}