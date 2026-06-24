"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Clock, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { employeeService } from "@/services/employee"
import { profileRequestService } from "@/services/profileRequest"

const genderLabel: Record<string, string> = { Nam: "Nam", Nu: "Nữ", Khac: "Khác" }

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  "Cho duyet": { label: "Chờ duyệt", color: "text-amber-600 bg-amber-50", icon: Clock },
  "Da duyet":  { label: "Đã duyệt",  color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  "Tu choi":   { label: "Từ chối",   color: "text-rose-600 bg-rose-50", icon: XCircle },
}

export function MyProfileInfo() {
  const { user } = useAuth()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ phone: "", address: "" })
  const [saving, setSaving] = useState(false)
  const [myRequests, setMyRequests] = useState<any[]>([])

  useEffect(() => {
    if (user?.employee_id) {
      employeeService.getById(user.employee_id).then(res => {
        setEmployee(res.data)
        setForm({ phone: res.data.phone || "", address: res.data.address || "" })
      }).finally(() => setLoading(false))
      fetchMyRequests()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchMyRequests = async () => {
    try {
      const res = await profileRequestService.getMy()
      setMyRequests(res.data)
    } catch {}
  }

  const getInitials = (name: string) => name?.split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase() || "?"

  const handleSubmitRequest = async () => {
    if (!employee) return
    const changes: { field: string; value: string }[] = []
    if (form.phone.trim() !== (employee.phone || "")) {
      changes.push({ field: "phone", value: form.phone.trim() })
    }
    if (form.address.trim() !== (employee.address || "")) {
      changes.push({ field: "address", value: form.address.trim() })
    }

    if (changes.length === 0) {
      alert("Bạn chưa thay đổi gì để gửi yêu cầu")
      return
    }

    try {
      setSaving(true)
      for (const change of changes) {
        await profileRequestService.create(change.field, change.value)
      }
      alert(`Đã gửi ${changes.length} yêu cầu thay đổi, vui lòng chờ HR duyệt`)
      setEditing(false)
      fetchMyRequests()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gửi yêu cầu")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Card className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></Card>
  }

  if (!employee) {
    return <Card className="p-6 text-center text-muted-foreground">Tài khoản chưa được gắn với hồ sơ nhân viên</Card>
  }

  const pendingFields = new Set(myRequests.filter(r => r.status === "Cho duyet").map(r => r.field_name))

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {getInitials(employee.full_name)}
        </div>
        <div>
          <p className="text-lg font-semibold">{employee.full_name}</p>
          <p className="text-sm text-muted-foreground">{employee.position_name || "—"} · {employee.department_name || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Mã nhân viên</label>
          <p className="mt-1 h-9 flex items-center px-3 text-sm font-mono bg-muted/50 rounded-md border border-input">{employee.employee_code}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <p className="mt-1 h-9 flex items-center px-3 text-sm bg-muted/50 rounded-md border border-input">{employee.email}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">
            SĐT {pendingFields.has("phone") && <span className="text-amber-600">(đang chờ duyệt)</span>}
          </label>
          {editing ? (
            <input
              disabled={pendingFields.has("phone")}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40 disabled:bg-muted disabled:cursor-not-allowed"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          ) : (
            <p className="mt-1 h-9 flex items-center px-3 text-sm bg-muted/50 rounded-md border border-input">{employee.phone || "—"}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Giới tính</label>
          <p className="mt-1 h-9 flex items-center px-3 text-sm bg-muted/50 rounded-md border border-input">{genderLabel[employee.gender] || "—"}</p>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm text-muted-foreground">
            Địa chỉ {pendingFields.has("address") && <span className="text-amber-600">(đang chờ duyệt)</span>}
          </label>
          {editing ? (
            <input
              disabled={pendingFields.has("address")}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40 disabled:bg-muted disabled:cursor-not-allowed"
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          ) : (
            <p className="mt-1 h-9 flex items-center px-3 text-sm bg-muted/50 rounded-md border border-input">{employee.address || "—"}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Ngày sinh</label>
          <p className="mt-1 h-9 flex items-center px-3 text-sm bg-muted/50 rounded-md border border-input">{employee.birth_date?.substring(0, 10) || "—"}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Ngày vào làm</label>
          <p className="mt-1 h-9 flex items-center px-3 text-sm bg-muted/50 rounded-md border border-input">{employee.hire_date?.substring(0, 10)}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Thay đổi SĐT/Địa chỉ cần được HR duyệt trước khi áp dụng. Các thông tin khác liên hệ HR để thay đổi.
      </p>

      <div className="flex gap-2 mt-4">
        {editing ? (
          <>
            <Button variant="outline" className="flex-1" onClick={() => { setEditing(false); setForm({ phone: employee.phone || "", address: employee.address || "" }) }}>Hủy</Button>
            <Button className="flex-1" onClick={handleSubmitRequest} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Gửi yêu cầu
            </Button>
          </>
        ) : (
          <Button className="flex-1" onClick={() => setEditing(true)}>Chỉnh sửa</Button>
        )}
      </div>

      {myRequests.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3">Lịch sử yêu cầu</h4>
          <div className="flex flex-col gap-2">
            {myRequests.map(r => {
              const config = statusConfig[r.status]
              const Icon = config.icon
              return (
                <div key={r.id} className={`flex items-center justify-between rounded-md p-3 text-sm ${config.color}`}>
                  <div>
                    <p className="font-medium">{r.field_name === "phone" ? "Số điện thoại" : "Địa chỉ"}: {r.old_value || "—"} → {r.new_value}</p>
                    {r.status === "Tu choi" && r.reject_reason && (
                      <p className="text-xs mt-1">Lý do từ chối: {r.reject_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
