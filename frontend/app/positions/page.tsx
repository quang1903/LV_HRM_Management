"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { useAuth } from "@/context/AuthContext"
import { departmentService } from "@/services/department"
import { positionService } from "@/services/position"

type Position = {
  id: number
  name: string
  department_id: number | null
  department_name: string | null
}

type Department = { id: number; name: string }

export default function PositionsPage() {
  const { user } = useAuth()
  const canEdit = user?.role === "admin" || user?.role === "hr"
  const canDelete = user?.role === "admin"

  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState("")

  const [showAdd, setShowAdd] = useState(false)
  const [newPosition, setNewPosition] = useState({ name: "", department_id: "" })

  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [deletePosition, setDeletePosition] = useState<Position | null>(null)

  useEffect(() => {
    fetchAll()
    departmentService.getAll().then(res => setDepartments(res.data)).catch(() => {})
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const res = await positionService.getAll()
      setPositions(res.data)
    } catch {
      alert("Không thể tải danh sách chức vụ")
    } finally {
      setLoading(false)
    }
  }

  const filtered = positions.filter(p =>
    filterDept ? String(p.department_id) === filterDept : true
  )

  // Group theo phòng ban để hiển thị
  const grouped = departments.map(d => ({
    dept: d,
    items: filtered.filter(p => p.department_id === d.id)
  })).filter(g => g.items.length > 0)

  const noGroup = filtered.filter(p => !p.department_id)

  const handleAdd = async () => {
    if (!newPosition.name.trim()) { alert("Vui lòng nhập tên chức vụ"); return }
    try {
      await positionService.create({
        name: newPosition.name.trim(),
        department_id: newPosition.department_id ? Number(newPosition.department_id) : null,
      })
      setShowAdd(false)
      setNewPosition({ name: "", department_id: "" })
      fetchAll()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi thêm chức vụ")
    }
  }

  const handleEdit = async () => {
    if (!editPosition || !editPosition.name.trim()) { alert("Vui lòng nhập tên chức vụ"); return }
    try {
      await positionService.update(editPosition.id, {
        name: editPosition.name.trim(),
        department_id: editPosition.department_id,
      })
      setEditPosition(null)
      fetchAll()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật chức vụ")
    }
  }

  const handleDelete = async () => {
    if (!deletePosition) return
    try {
      await positionService.delete(deletePosition.id)
      setDeletePosition(null)
      fetchAll()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa chức vụ")
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Quản lý chức vụ</h2>
              <p className="mt-1 text-sm text-muted-foreground">Quản lý danh sách chức vụ theo từng phòng ban</p>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Danh sách chức vụ</h2>
                  <p className="text-sm text-muted-foreground">
                    Tổng cộng <span className="font-medium text-foreground">{positions.length}</span> chức vụ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                  >
                    <option value="">Tất cả phòng ban</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {canEdit && (
                    <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
                      <Plus className="h-4 w-4" />Thêm chức vụ
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {grouped.map(g => (
                    <div key={g.dept.id}>
                      <div className="bg-muted/40 px-5 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {g.dept.name}
                        </span>
                      </div>
                      {g.items.map(pos => (
                        <div key={pos.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary/60" />
                            <span className="text-sm font-medium">{pos.name}</span>
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1">
                              <button type="button"
                                onClick={() => setEditPosition({ ...pos })}
                                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                                <Pencil className="h-4 w-4" />
                              </button>
                              {canDelete && (
                                <button type="button"
                                  onClick={() => setDeletePosition(pos)}
                                  className="rounded-md p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {noGroup.length > 0 && (
                    <div>
                      <div className="bg-muted/40 px-5 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Chưa gán phòng ban
                        </span>
                      </div>
                      {noGroup.map(pos => (
                        <div key={pos.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                            <span className="text-sm font-medium">{pos.name}</span>
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1">
                              <button type="button"
                                onClick={() => setEditPosition({ ...pos })}
                                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                                <Pencil className="h-4 w-4" />
                              </button>
                              {canDelete && (
                                <button type="button"
                                  onClick={() => setDeletePosition(pos)}
                                  className="rounded-md p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <p className="text-sm">Chưa có chức vụ nào</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Modal Thêm */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thêm chức vụ</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Tên chức vụ *</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newPosition.name}
                    onChange={e => setNewPosition({ ...newPosition, name: e.target.value })}
                    placeholder="VD: Kế toán viên"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phòng ban</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newPosition.department_id}
                    onChange={e => setNewPosition({ ...newPosition, department_id: e.target.value })}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Hủy</Button>
                <Button className="flex-1" onClick={handleAdd}>Thêm</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa */}
      {editPosition && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sửa chức vụ</h3>
                <button onClick={() => setEditPosition(null)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Tên chức vụ *</label>
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={editPosition.name}
                    onChange={e => setEditPosition({ ...editPosition, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phòng ban</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={editPosition.department_id || ""}
                    onChange={e => setEditPosition({ ...editPosition, department_id: Number(e.target.value) || null })}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditPosition(null)}>Hủy</Button>
                <Button className="flex-1" onClick={handleEdit}>Lưu</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {deletePosition && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Bạn có chắc muốn xóa chức vụ <span className="font-medium text-foreground">{deletePosition.name}</span>?
                Chức vụ đang được gán cho nhân viên sẽ không thể xóa.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeletePosition(null)}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete}>Xóa</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
