"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/services/auth"

export function ChangePasswordForm() {
  //Mật khẩu hiện tại
  const [oldPassword, setOldPassword] = useState("")
  //Mật khẩu mới
  const [newPassword, setNewPassword] = useState("")
  //Xác nhận mật khẩu mới
  const [confirmPassword, setConfirmPassword] = useState("")
  //Trạng thái hiện/ẩn mật khẩu
  const [showPw, setShowPw] = useState(false)
  //Trạng thái tải
  const [loading, setLoading] = useState(false)

  //TỰ ĐỘNG KIỂM TRA 4 ĐIỀU KIỆN MẬT KHẨU MẠNH THỜI GIAN THỰC
  const rules = useMemo(() => ({
    length: newPassword.length >= 8,
    letter: /[a-zA-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
  }), [newPassword])

  //Kiểm tra tất cả các điều kiện
  const allValid = rules.length && rules.letter && rules.number && rules.special

  // HÀM ĐỔI MẬT KHẨU
  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin")
      return
    }
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp")
      return
    }
    if (!allValid) {
      alert("Mật khẩu mới chưa đạt yêu cầu, kiểm tra lại các điều kiện bên dưới")
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

  // Component phụ hiển thị trạng thái tick xanh (Check) hoặc gạch đỏ (X)
  const RuleItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={cn("flex items-center gap-1.5 text-xs", ok ? "text-emerald-600" : "text-muted-foreground")}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {label}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Ô nhập Mật khẩu hiện tại */}
      <div>
        <label className="text-sm text-muted-foreground">Mật khẩu hiện tại</label>
        {/* Nhập mật khẩu hiện tại */}
        <input type={showPw ? "text" : "password"}
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
          value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
      </div>

      {/* Ô nhập Mật khẩu mới */}
      <div>
        <label className="text-sm text-muted-foreground">Mật khẩu mới</label>
        {/* Nhập mật khẩu mới */}
        <input type={showPw ? "text" : "password"}
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
          value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        {/* Danh sách tiêu chí mật khẩu mạnh */}
        {newPassword && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <RuleItem ok={rules.length} label="Tối thiểu 8 ký tự" />
            <RuleItem ok={rules.letter} label="Có chữ cái" />
            <RuleItem ok={rules.number} label="Có chữ số" />
            <RuleItem ok={rules.special} label="Có ký tự đặc biệt" />
          </div>
        )}
      </div>

      {/* Ô nhập Xác nhận mật khẩu mới */}
      <div>
        <label className="text-sm text-muted-foreground">Xác nhận mật khẩu mới</label>
        {/* Nhập xác nhận mật khẩu mới */}
        <input type={showPw ? "text" : "password"}
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      </div>
      {/* Nút ẩn/hiện mật khẩu */}
      <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs text-muted-foreground flex items-center gap-1 self-start">
        {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        {showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      </button>
      {/* Nút Đổi mật khẩu */}
      <Button onClick={handleSubmit} disabled={loading} className="mt-1">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Đổi mật khẩu
      </Button>
    </div>
  )
}
