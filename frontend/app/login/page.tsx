"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail]       = useState("admin@hrm.com")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (res.success) router.push("/")
    else setError(res.error || "Đăng nhập thất bại")
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 flex-col text-white">
        <h1 className="text-4xl font-bold mb-4">HRM Pro</h1>
        <p className="text-xl opacity-80 text-center">Hệ thống quản lý nhân sự toàn diện</p>
        <ul className="mt-8 space-y-3 text-sm opacity-70">
          <li>✓ Quản lý hồ sơ nhân viên</li>
          <li>✓ Theo dõi chấm công & nghỉ phép</li>
          <li>✓ Quản lý hợp đồng lao động</li>
          <li>✓ Báo cáo & thống kê trực quan</li>
        </ul>
        <p className="mt-12 text-xs opacity-50">© 2026 HRM Pro — Luận văn tốt nghiệp</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-2">Đăng nhập</h2>
          <p className="text-muted-foreground text-sm mb-8">Nhập thông tin tài khoản để tiếp tục</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mật khẩu</label>
              <div className="relative mt-1">
                <input
                  type={showPw ? "text" : "password"}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus:ring-2 ring-ring/40"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600 flex items-center gap-2">
                <span>⚠</span>{error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Đăng nhập
            </Button>
          </form>

          <div className="mt-8 border-t pt-6">
            <p className="text-xs text-muted-foreground text-center mb-3">Tài khoản demo</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Quản trị viên", email: "admin@hrm.com", color: "bg-purple-50 text-purple-700" },
                { label: "Nhân sự (HR)", email: "hr@hrm.com", color: "bg-blue-50 text-blue-700" },
                { label: "Quản lý", email: "manager@hrm.com", color: "bg-amber-50 text-amber-700" },
                { label: "Nhân viên", email: "nv001@hrm.com", color: "bg-emerald-50 text-emerald-700" },
              ].map(acc => (
                <button key={acc.email} type="button"
                  className={`rounded-md p-2 text-left text-xs ${acc.color} hover:opacity-80`}
                  onClick={() => { setEmail(acc.email); setPassword("123456") }}
                >
                  <p className="font-medium">{acc.label}</p>
                  <p className="opacity-70">{acc.email}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Mật khẩu tất cả tài khoản demo: 123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}