"use client"

import { useState, useEffect } from "react"
import { Plus, X, Loader2, KeyRound, ToggleLeft, ToggleRight, Pencil, Smartphone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { userService } from "@/services/user"
import { employeeService } from "@/services/employee"

type User = {
  id: number
  username: string
  email: string
  role: string
  is_active: number
  full_name: string | null
  employee_code: string | null
  last_login_at: string | null
}

const roleLabel: Record<string, string> = {
  admin:    "Quản trị viên",
  hr:       "Nhân sự",
  manager:  "Quản lý",
  employee: "Nhân viên",
}

const roleStyles: Record<string, string> = {
  admin:    "bg-purple-50 text-purple-700",
  hr:       "bg-blue-50 text-blue-700",
  manager:  "bg-amber-50 text-amber-700",
  employee: "bg-emerald-50 text-emerald-700",
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [resetModal, setResetModal] = useState<{ id: number; username: string } | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [newUser, setNewUser] = useState({
    username: "", email: "", password: "", role: "employee", employee_id: ""
  })

  useEffect(() => {
    fetchUsers()
    employeeService.getAll().then(res => setEmployees(res.data)).catch(() => {})
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await userService.getAll()
      setUsers(res.data)
    } catch {
      alert("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await userService.toggle(id)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi thay đổi trạng thái")
    }
  }

  const handleEdit = async () => {
    if (!editUser) return
    try {
      await userService.update(editUser.id, { role: editUser.role })
      setEditUser(null)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật")
    }
  }

  const handleAdd = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert("Vui lòng nhập đầy đủ thông tin")
      return
    }
    try {
      await userService.create({
        ...newUser,
        employee_id: newUser.employee_id ? Number(newUser.employee_id) : null
      })
      setShowAdd(false)
      setNewUser({ username: "", email: "", password: "", role: "employee", employee_id: "" })
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi tạo tài khoản")
    }
  }

  const handleResetPassword = async () => {
    if (!resetModal || !newPassword.trim()) {
      alert("Vui lòng nhập mật khẩu mới")
      return
    }
    try {
      await userService.resetPassword(resetModal.id, { password: newPassword })
      setResetModal(null)
      setNewPassword("")
      alert("Đặt lại mật khẩu thành công!")
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi đặt lại mật khẩu")
    }
  }

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
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold">Danh sách tài khoản</h2>
            <p className="text-sm text-muted-foreground">Tổng cộng {users.length} tài khoản</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />Tạo tài khoản
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Tài khoản</th>
                <th className="px-5 py-3">Nhân viên</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Đăng nhập gần nhất</th>
                <th className="px-5 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium">{u.username}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {u.full_name ? (
                      <div className="flex flex-col leading-tight">
                        <span>{u.full_name}</span>
                        <span className="text-xs font-mono">{u.employee_code}</span>
                      </div>
                    ) : "Chưa gắn"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", roleStyles[u.role])}>
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      u.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"
                    )}>
                      {u.is_active ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setEditUser({ ...u })} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Đổi role">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => { setResetModal({ id: u.id, username: u.username }); setNewPassword("") }} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Đặt lại mật khẩu">
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={async () => {
                        if (confirm(`Reset thiết bị cho ${u.username}?`)) {
                          try {
                            await userService.resetDevice(u.id)
                            alert("Đã reset thiết bị!")
                          } catch (err: any) {
                            alert(err.response?.data?.message || "Lỗi")
                          }
                        }
                      }} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Reset thiết bị">
                        <Smartphone className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleToggle(u.id)} className={cn("rounded-md p-2 transition-colors", u.is_active ? "text-emerald-600 hover:bg-rose-50 hover:text-rose-600" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600")} title={u.is_active ? "Vô hiệu hóa" : "Kích hoạt"}>
                        {u.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Sửa role */}
      {editUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Đổi quyền — {editUser.username}</h3>
                <button onClick={() => setEditUser(null)}><X className="h-5 w-5" /></button>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Role</label>
                <select
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  value={editUser.role}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                >
                  <option value="admin">Quản trị viên</option>
                  <option value="hr">Nhân sự</option>
                  <option value="manager">Quản lý</option>
                  <option value="employee">Nhân viên</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Hủy</Button>
                <Button className="flex-1" onClick={handleEdit}>Lưu</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset mật khẩu */}
      {resetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Đặt lại mật khẩu</h3>
                <button onClick={() => setResetModal(null)}><X className="h-5 w-5" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Tài khoản: <span className="font-medium text-foreground">{resetModal.username}</span></p>
              <div>
                <label className="text-sm text-muted-foreground">Mật khẩu mới *</label>
                <input
                  type="password"
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setResetModal(null)}>Hủy</Button>
                <Button className="flex-1" onClick={handleResetPassword}>Xác nhận</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo tài khoản */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tạo tài khoản mới</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Username *", field: "username" },
                  { label: "Email *", field: "email" },
                  { label: "Mật khẩu *", field: "password" },
                ].map(item => (
                  <div key={item.field}>
                    <label className="text-sm text-muted-foreground">{item.label}</label>
                    <input
                      type={item.field === "password" ? "password" : "text"}
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                      value={newUser[item.field as keyof typeof newUser]}
                      onChange={e => setNewUser({ ...newUser, [item.field]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-sm text-muted-foreground">Role</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="admin">Quản trị viên</option>
                    <option value="hr">Nhân sự</option>
                    <option value="manager">Quản lý</option>
                    <option value="employee">Nhân viên</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Gắn với nhân viên</label>
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                    value={newUser.employee_id}
                    onChange={e => setNewUser({ ...newUser, employee_id: e.target.value })}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.filter((e: any) => e.status === "Dang lam").map((e: any) => (
                      <option key={e.id} value={e.id}>{e.employee_code} — {e.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Hủy</Button>
                <Button className="flex-1" onClick={handleAdd}>Tạo</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}