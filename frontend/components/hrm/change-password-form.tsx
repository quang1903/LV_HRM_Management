"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { authService } from "@/services/auth"

export function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin")
      return
    }
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp")
      return
    }
    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }
    try {
      setLoading(true)
      await authService.changePassword({ old_password: oldPassword, new_password: newPassword })
      alert("Đổi mật khẩu thành công!")
      setOldPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi đổi mật khẩu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-sm">
      <div>
        <label className="text-sm text-muted-foreground">Mật khẩu hiện tại</label>
        <input type={showPw ? "text" : "password"}
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
          value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Mật khẩu mới</label>
        <input type={showPw ? "text" : "password"}
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
          value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Xác nhận mật khẩu mới</label>
        <input type={showPw ? "text" : "password"}
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      </div>
      <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs text-muted-foreground flex items-center gap-1 self-start">
        {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        {showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      </button>
      <Button onClick={handleSubmit} disabled={loading} className="mt-1">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Đổi mật khẩu
      </Button>
    </div>
  )
}
