"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X } from "lucide-react"
import { profileRequestService } from "@/services/profileRequest"

const fieldLabel: Record<string, string> = { phone: "Số điện thoại", address: "Địa chỉ" }

export default function ProfileRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("Cho duyet")
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => { fetchRequests() }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await profileRequestService.getAll(filter || undefined)
      setRequests(res.data)
    } catch {
      alert("Không thể tải danh sách yêu cầu")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!confirm("Duyệt yêu cầu này?")) return
    try {
      await profileRequestService.approve(id)
      fetchRequests()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi duyệt")
    }
  }

  const handleReject = async () => {
    if (!rejectingId) return
    try {
      await profileRequestService.reject(rejectingId, rejectReason)
      setRejectingId(null)
      setRejectReason("")
      fetchRequests()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi từ chối")
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Yêu cầu thay đổi thông tin</h2>
              <p className="text-sm text-muted-foreground">Duyệt yêu cầu sửa SĐT/địa chỉ của nhân viên</p>
            </div>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="Cho duyet">Chờ duyệt</option>
              <option value="Da duyet">Đã duyệt</option>
              <option value="Tu choi">Từ chối</option>
              <option value="">Tất cả</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">Không có yêu cầu nào</Card>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map(r => (
                <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium">{r.full_name} <span className="text-xs font-mono text-muted-foreground">({r.employee_code})</span></p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {fieldLabel[r.field_name]}: <span className="line-through">{r.old_value || "—"}</span> → <span className="font-medium text-foreground">{r.new_value}</span>
                    </p>
                    {r.status === "Tu choi" && r.reject_reason && (
                      <p className="text-xs text-rose-600 mt-1">Lý do từ chối: {r.reject_reason}</p>
                    )}
                  </div>
                  {r.status === "Cho duyet" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="gap-2" onClick={() => handleApprove(r.id)}>
                        <Check className="h-4 w-4" />Duyệt
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => setRejectingId(r.id)}>
                        <X className="h-4 w-4" />Từ chối
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {rejectingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-3">Từ chối yêu cầu</h3>
              <label className="text-sm text-muted-foreground">Lý do (không bắt buộc)</label>
              <input className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setRejectingId(null); setRejectReason("") }}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={handleReject}>Từ chối</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
