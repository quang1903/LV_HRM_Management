"use client"

import { useState, useEffect } from "react"
import { Search, Plus, X, CheckCircle, XCircle, Clock, Pencil, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { attendanceService } from "@/services/attendance"
import { employeeService } from "@/services/employee"

type Attendance = {
  id: number
  employee_id: number
  full_name: string
  employee_code: string
  department_name: string
  work_date: string
  check_in: string | null
  check_out: string | null
  work_minutes: number
  status: string
}

const statusStyles: Record<string, string> = {
  "Dung gio": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Di tre":   "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Ve som":   "bg-blue-50 text-blue-700 ring-blue-600/20",
  "Vang mat": "bg-rose-50 text-rose-700 ring-rose-600/20",
}

const statusLabel: Record<string, string> = {
  "Dung gio": "Đúng giờ",
  "Di tre":   "Đi trễ",
  "Ve som":   "Về sớm",
  "Vang mat": "Vắng mặt",
}

function getInitials(name: string) {
  return name?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?"
}

export function AttendanceTable() {
  const { user } = useAuth()
  const canEdit = user?.role === "admin" || user?.role === "hr"

  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [employees, setEmployees]     = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [month, setMonth]             = useState(new Date().getMonth() + 1)
  const [year, setYear]               = useState(new Date().getFullYear())
  const [showAdd, setShowAdd]         = useState(false)
  const [filterStatus, setFilterStatus] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const [editAttendance, setEditAttendance] = useState<Attendance | null>(null)
  const [newAttendance, setNewAttendance]   = useState({
    employee_id: "", work_date: "", check_in: "", check_out: "", status: "Dung gio"
  })

  useEffect(() => {
    fetchAttendances()
  }, [month, year])

  useEffect(() => {
    if (canEdit) {
      employeeService.getAll()
        .then(res => setEmployees(res.data.filter((e: any) => e.status === "Dang lam")))
        .catch(() => {})
    }
  }, [canEdit])

  const fetchAttendances = async () => {
    try {
      setLoading(true)
      const res = await attendanceService.getAll({ month, year })
      setAttendances(res.data)
    } catch {
      alert("Không thể tải dữ liệu chấm công")
    } finally {
      setLoading(false)
    }
  }

  const filtered = attendances.filter(a => {
    const matchSearch =
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.department_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.employee_code?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus ? a.status === filterStatus : true
    if (user?.role === "employee") return a.employee_id === user.employee_id && matchSearch && matchStatus
    return matchSearch && matchStatus
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleEdit = async () => {
    if (!editAttendance) return
    try {
      await attendanceService.update(editAttendance.id, {
        check_in:  editAttendance.check_in,
        check_out: editAttendance.check_out,
        status:    editAttendance.status,
      })
      setEditAttendance(null)
      fetchAttendances()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật chấm công")
    }
  }

  const handleAdd = async () => {
    if (!newAttendance.employee_id || !newAttendance.work_date) {
      alert("Vui lòng nhập đầy đủ thông tin")
      return
    }
    try {
      await attendanceService.create({
        employee_id: Number(newAttendance.employee_id),
        work_date:   newAttendance.work_date,
        check_in:    newAttendance.check_in || null,
        check_out:   newAttendance.check_out || null,
        status:      newAttendance.status,
      })
      setShowAdd(false)
      setNewAttendance({ employee_id: "", work_date: "", check_in: "", check_out: "", status: "Dung gio" })
      fetchAttendances()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi thêm chấm công")
    }
  }

  const stats = [
    { label: "Đúng giờ", value: filtered.filter(a => a.status === "Dung gio").length, color: "text-emerald-600" },
    { label: "Đi trễ",   value: filtered.filter(a => a.status === "Di tre").length,   color: "text-amber-600" },
    { label: "Về sớm",   value: filtered.filter(a => a.status === "Ve som").length,   color: "text-blue-600" },
    { label: "Vắng mặt", value: filtered.filter(a => a.status === "Vang mat").length, color: "text-rose-600" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-2xl font-semibold mt-1", stat.color)}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Bảng chấm công</h2>
            <p className="text-sm text-muted-foreground">Theo dõi giờ vào/ra của nhân viên</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="search" placeholder="Tìm kiếm..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 ring-ring/40 md:w-56"
              />
            </div>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value="">Tất cả trạng thái</option>
              <option value="Dung gio">Đúng giờ</option>
              <option value="Di tre">Đi trễ</option>
              <option value="Ve som">Về sớm</option>
              <option value="Vang mat">Vắng mặt</option>
            </select>
            {canEdit && (
              <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />Thêm chấm công
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Nhân viên</th>
                <th className="px-5 py-3">Phòng ban</th>
                <th className="px-5 py-3">Ngày</th>
                <th className="px-5 py-3">Check-in</th>
                <th className="px-5 py-3">Check-out</th>
                <th className="px-5 py-3">Giờ làm</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">{canEdit ? "Hành động" : ""}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((att) => (
                <tr key={att.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(att.full_name)}
                      </div>
                      <span className="font-medium">{att.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{att.department_name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{att.work_date?.substring(0, 10)}</td>
                  <td className="px-5 py-4 font-medium">{att.check_in ? att.check_in.substring(11, 16) : "—"}</td>
                  <td className="px-5 py-4 font-medium">{att.check_out ? att.check_out.substring(11, 16) : "—"}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {att.work_minutes ? `${Math.floor(att.work_minutes / 60)}h${att.work_minutes % 60 > 0 ? `${att.work_minutes % 60}p` : ""}` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", statusStyles[att.status] || "bg-slate-100 text-slate-600")}>
                      {statusLabel[att.status] || att.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setEditAttendance({ ...att })} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-5 py-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Hiển thị <span className="font-medium text-foreground">{paginated.length}</span> / <span className="font-medium text-foreground">{filtered.length}</span> bản ghi</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded px-2 py-1 text-xs border border-input hover:bg-muted disabled:opacity-40">
                ←
              </button>
              <span className="px-2 text-xs">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded px-2 py-1 text-xs border border-input hover:bg-muted disabled:opacity-40">
                →
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal Sửa */}
      {editAttendance && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Điều chỉnh chấm công</h3>
                <button onClick={() => setEditAttendance(null)}><X className="h-5 w-5" /></button>
              </div>
              <p className="font-medium mb-3">{editAttendance.full_name} — {editAttendance.work_date?.substring(0, 10)}</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Giờ check-in</label>
                  <input type="datetime-local"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={editAttendance.check_in?.substring(0, 16) || ""}
                    onChange={e => setEditAttendance({ ...editAttendance, check_in: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Giờ check-out</label>
                  <input type="datetime-local"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={editAttendance.check_out?.substring(0, 16) || ""}
                    onChange={e => setEditAttendance({ ...editAttendance, check_out: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Trạng thái</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={editAttendance.status}
                    onChange={e => setEditAttendance({ ...editAttendance, status: e.target.value })}
                  >
                    {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditAttendance(null)}>Hủy</Button>
                <Button className="flex-1" onClick={handleEdit}>Lưu</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thêm chấm công</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Nhân viên *</label>
                  <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newAttendance.employee_id}
                    onChange={e => setNewAttendance({ ...newAttendance, employee_id: e.target.value })}>
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.employee_code} — {e.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Ngày làm *</label>
                  <input type="date" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newAttendance.work_date}
                    onChange={e => setNewAttendance({ ...newAttendance, work_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Giờ check-in</label>
                  <input type="time" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newAttendance.check_in}
                    onChange={e => setNewAttendance({ ...newAttendance, check_in: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Giờ check-out</label>
                  <input type="time" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newAttendance.check_out}
                    onChange={e => setNewAttendance({ ...newAttendance, check_out: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Trạng thái</label>
                  <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newAttendance.status}
                    onChange={e => setNewAttendance({ ...newAttendance, status: e.target.value })}>
                    {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
    </>
  )
}