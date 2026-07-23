"use client"

import { useState, useEffect } from "react"
import { Search, Plus, X, Eye, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { leaveService } from "@/services/leave"

type LeaveStatus = "Cho duyet" | "Da duyet" | "Tu choi"
type LeaveType = "Nghi phep" | "Nghi om" | "Nghi thai san" | "Nghi khong luong"

type LeaveRequest = {
  id: number
  employee_id: number
  full_name: string
  employee_code: string
  department_name: string
  request_type: LeaveType
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  reject_reason: string | null
  approved_by: number | null
  approved_at: string | null
}

const statusStyles: Record<string, string> = {
  "Cho duyet": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Da duyet": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Tu choi": "bg-rose-50 text-rose-700 ring-rose-600/20",
}

const statusLabel: Record<string, string> = {
  "Cho duyet": "Chờ duyệt",
  "Da duyet": "Đã duyệt",
  "Tu choi": "Từ chối",
}

const typeStyles: Record<string, string> = {
  "Nghi phep": "bg-blue-50 text-blue-700",
  "Nghi om": "bg-rose-50 text-rose-700",
  "Nghi thai san": "bg-purple-50 text-purple-700",
  "Nghi khong luong": "bg-slate-50 text-slate-700",
}

const typeLabel: Record<string, string> = {
  "Nghi phep": "Nghỉ phép",
  "Nghi om": "Nghỉ ốm",
  "Nghi thai san": "Nghỉ thai sản",
  "Nghi khong luong": "Nghỉ không lương",
}

function getInitials(name: string) {
  return name?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?"
}

// Tính số ngày nghỉ thật — loại bỏ Chủ nhật, Thứ 7 vẫn tính là ngày làm việc
function countWorkingDays(startStr: string, endStr: string) {
  if (!startStr || !endStr) return 0
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (end < start) return 0
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    if (current.getDay() !== 0) { // 0 = Chủ nhật
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function LeaveTable() {
  const { user } = useAuth()
  const isHRorAdmin = user?.role === "admin" || user?.role === "hr"
  const isManager = user?.role === "manager"
  const canApprove = user?.role === "admin" || user?.role === "hr" || user?.role === "manager"
  const canSubmit = !!user?.employee_id

  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [viewLeave, setViewLeave] = useState<LeaveRequest | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [newLeave, setNewLeave] = useState({
    request_type: "Nghi phep" as LeaveType,
    start_date: "", end_date: "", total_days: 1, reason: ""
  })

  useEffect(() => {
    fetchLeaves()
  }, [])

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const res = await leaveService.getAll()
      setLeaves(res.data)
    } catch {
      alert("Không thể tải danh sách đơn nghỉ phép")
    } finally {
      setLoading(false)
    }
  }

  const myLeaves = user?.role === "employee"
    ? leaves.filter(l => l.employee_id === user.employee_id)
    : leaves

  const filtered = leaves.filter(l => {
    const matchSearch =
      l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.department_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus ? l.status === filterStatus : true
    if (user?.role === "employee") return l.employee_id === user.employee_id && matchSearch && matchStatus
    return matchSearch && matchStatus
  })

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  const handleApprove = async (id: number) => {
    try {
      await leaveService.approve(id)
      fetchLeaves()
      setViewLeave(null)
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi duyệt đơn")
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    if (!rejectReason.trim()) { alert("Vui lòng nhập lý do từ chối"); return }
    try {
      await leaveService.reject(rejectModal.id, { reject_reason: rejectReason })
      setRejectModal(null)
      setRejectReason("")
      fetchLeaves()
      setViewLeave(null)
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi từ chối đơn")
    }
  }

  const handleAdd = async () => {
    if (!user?.employee_id) { alert("Tài khoản chưa được gắn với nhân viên"); return }
    if (!newLeave.start_date || !newLeave.end_date) { alert("Vui lòng nhập ngày bắt đầu và kết thúc"); return }
    try {
      await leaveService.create({
        employee_id: user.employee_id,
        request_type: newLeave.request_type,
        start_date: newLeave.start_date,
        end_date: newLeave.end_date,
        total_days: newLeave.total_days,
        reason: newLeave.reason,
      })
      setShowAdd(false)
      setNewLeave({ request_type: "Nghi phep", start_date: "", end_date: "", total_days: 1, reason: "" })
      fetchLeaves()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gửi đơn")
    }
  }

  const stats = [
    { label: "Chờ duyệt", value: myLeaves.filter(l => l.status === "Cho duyet").length, color: "text-amber-600" },
    { label: "Đã duyệt", value: myLeaves.filter(l => l.status === "Da duyet").length, color: "text-emerald-600" },
    { label: "Từ chối", value: myLeaves.filter(l => l.status === "Tu choi").length, color: "text-rose-600" },
    { label: "Tổng đơn", value: myLeaves.length, color: "text-blue-600" },
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
            <h2 className="text-base font-semibold">Danh sách đơn nghỉ phép</h2>
            <p className="text-sm text-muted-foreground">Quản lý đơn xin nghỉ phép của nhân viên</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="search" placeholder="Tìm kiếm..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 ring-ring/40 md:w-56"
              />
            </div>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value="">Tất cả trạng thái</option>
              <option value="Cho duyet">Chờ duyệt</option>
              <option value="Da duyet">Đã duyệt</option>
              <option value="Tu choi">Từ chối</option>
            </select>
            {canSubmit && (
              <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />Gửi đơn
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Nhân viên</th>
                <th className="px-5 py-3">Loại đơn</th>
                <th className="px-5 py-3">Từ ngày</th>
                <th className="px-5 py-3">Đến ngày</th>
                <th className="px-5 py-3">Số ngày</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((leave) => (
                <tr key={leave.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(leave.full_name)}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{leave.full_name}</span>
                        <span className="text-xs text-muted-foreground">{leave.department_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", typeStyles[leave.request_type] || "bg-gray-50 text-gray-700")}>
                      {typeLabel[leave.request_type] || leave.request_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{leave.start_date?.substring(0, 10)}</td>
                  <td className="px-5 py-4 text-muted-foreground">{leave.end_date?.substring(0, 10)}</td>
                  <td className="px-5 py-4 font-medium">{leave.total_days} ngày</td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", statusStyles[leave.status] || "bg-gray-50 text-gray-600")}>
                      {statusLabel[leave.status] || leave.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setViewLeave(leave)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </button>
                      {canApprove && leave.status === "Cho duyet" && leave.employee_id !== user?.employee_id && (
                        <>
                          <button type="button" onClick={() => handleApprove(leave.id)} className="rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                            Duyệt
                          </button>
                          <button type="button" onClick={() => { setRejectModal({ id: leave.id }); setRejectReason("") }} className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm text-muted-foreground">
          <p>Hiển thị <span className="font-medium text-foreground">{filtered.length}</span> trong tổng số <span className="font-medium text-foreground">{myLeaves.length}</span> đơn</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-md px-3 py-1 text-sm border border-border hover:bg-muted disabled:opacity-40">
                Trước
              </button>
              <span>{page} / {totalPages}</span>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-md px-3 py-1 text-sm border border-border hover:bg-muted disabled:opacity-40">
                Sau
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal Xem */}
      {viewLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Chi tiết đơn nghỉ phép</h3>
                <button onClick={() => setViewLeave(null)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Nhân viên", value: viewLeave.full_name },
                  { label: "Phòng ban", value: viewLeave.department_name },
                  { label: "Loại đơn", value: typeLabel[viewLeave.request_type] || viewLeave.request_type },
                  { label: "Từ ngày", value: viewLeave.start_date?.substring(0, 10) },
                  { label: "Đến ngày", value: viewLeave.end_date?.substring(0, 10) },
                  { label: "Số ngày", value: `${viewLeave.total_days} ngày` },
                  { label: "Lý do", value: viewLeave.reason },
                  { label: "Trạng thái", value: statusLabel[viewLeave.status] || viewLeave.status },
                  ...(viewLeave.reject_reason ? [{ label: "Lý do từ chối", value: viewLeave.reject_reason }] : []),
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground text-sm">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                {canApprove && viewLeave.status === "Cho duyet" && viewLeave.employee_id !== user?.employee_id && (
                  <>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(viewLeave.id)}>Duyệt</Button>
                    <Button variant="destructive" className="flex-1" onClick={() => { setRejectModal({ id: viewLeave.id }); setRejectReason("") }}>Từ chối</Button>
                  </>
                )}
                <Button variant="outline" className="flex-1" onClick={() => setViewLeave(null)}>Đóng</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ chối */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-3">Lý do từ chối</h3>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 ring-ring/40 min-h-[80px]"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={handleReject}>Xác nhận</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gửi đơn */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Gửi đơn nghỉ phép</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Loại đơn</label>
                  <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newLeave.request_type}
                    onChange={e => setNewLeave({ ...newLeave, request_type: e.target.value as LeaveType })}>
                    <option value="Nghi phep">Nghỉ phép</option>
                    <option value="Nghi om">Nghỉ ốm</option>
                    <option value="Nghi thai san">Nghỉ thai sản</option>
                    <option value="Nghi khong luong">Nghỉ không lương</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Từ ngày *</label>
                  <input type="date" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newLeave.start_date}
                    onChange={e => {
                      const start = e.target.value
                      const end = newLeave.end_date
                      const days = countWorkingDays(start, end)
                      setNewLeave({ ...newLeave, start_date: start, total_days: days })
                    }} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Đến ngày *</label>
                  <input type="date" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newLeave.end_date}
                    onChange={e => {
                      const end = e.target.value
                      const start = newLeave.start_date
                      const days = countWorkingDays(start, end)
                      setNewLeave({ ...newLeave, end_date: end, total_days: days })
                    }} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Số ngày nghỉ (đã trừ Chủ nhật)</label>
                  <p className="mt-1 h-9 flex items-center px-3 text-sm font-medium bg-muted/50 rounded-md border border-input">
                    {newLeave.total_days} ngày
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Lý do</label>
                  <input className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                    value={newLeave.reason}
                    onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Hủy</Button>
                <Button className="flex-1" onClick={handleAdd}>Gửi đơn</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}