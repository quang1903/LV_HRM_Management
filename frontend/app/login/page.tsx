"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Briefcase, Users } from "lucide-react"

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

  const demoAccounts = [
    { label: "Quản trị viên", email: "admin@hrm.com",              color: "#6d28d9", bg: "#f5f3ff", border: "#ede9fe" },
    { label: "Nhân sự (HR)",  email: "hr@hrm.com",                 color: "#1d4ed8", bg: "#eff6ff", border: "#dbeafe" },
    { label: "Quản lý",       email: "nguyen.van.an@hrm.com",      color: "#b45309", bg: "#fffbeb", border: "#fef3c7" },
    { label: "Nhân viên",     email: "tran.thi.bich@hrm.com",      color: "#15803d", bg: "#f0fdf4", border: "#dcfce7" },
  ]

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc" }}>

      {/* LEFT */}
      <div className="hidden lg:flex" style={{
        width: "42%", flexDirection: "column", justifyContent: "space-between",
        padding: 40, background: "#0f172a", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -120, right: -120, width: 340, height: 340, borderRadius: "50%", background: "rgba(99,102,241,0.1)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(99,102,241,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 180, height: 180, borderRadius: "50%", background: "rgba(99,102,241,0.05)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, position: "relative", zIndex: 1 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>HRM Pro</div>
            <div style={{ fontSize: 10.5, color: "#475569" }}>Quản lý nhân sự</div>
          </div>
        </div>

        {/* Center */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px",
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Users style={{ width: 30, height: 30, color: "#818cf8" }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, marginBottom: 10 }}>
            Quản lý nhân sự<br />
            <span style={{ color: "#818cf8" }}>toàn diện</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
            Hệ thống HRM hiện đại dành cho doanh nghiệp Việt Nam
          </div>
        </div>

        <div style={{ fontSize: 10.5, color: "#1e293b", position: "relative", zIndex: 1, textAlign: "center" }}>
          © 2026 HRM Pro — Luận văn tốt nghiệp
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            Chào mừng trở lại
          </div>
          <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 28 }}>
            Nhập thông tin tài khoản để tiếp tục
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: "100%", height: 40, borderRadius: 8,
                  border: "1px solid #e2e8f0", background: "#f8fafc",
                  padding: "0 12px", fontSize: 13, color: "#0f172a", outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%", height: 40, borderRadius: 8,
                    border: "1px solid #e2e8f0", background: "#f8fafc",
                    padding: "0 38px 0 12px", fontSize: 13, color: "#0f172a", outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#6366f1")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                borderRadius: 8, background: "#fff1f2", border: "1px solid #fecdd3",
                padding: "9px 12px", fontSize: 12.5, color: "#be123c",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <span>⚠</span>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 40, borderRadius: 8,
                background: loading ? "#a5b4fc" : "#6366f1",
                color: "#fff", border: "none",
                fontSize: 13, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 2px 12px rgba(99,102,241,0.28)",
                transition: "opacity 0.15s",
              }}
            >
              {loading && <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />}
              Đăng nhập
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 14px" }}>
            <div style={{ flex: 1, height: 0.5, background: "#f1f5f9" }} />
            <span style={{ fontSize: 10.5, color: "#cbd5e1" }}>Tài khoản demo</span>
            <div style={{ flex: 1, height: 0.5, background: "#f1f5f9" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword("123456") }}
                style={{
                  borderRadius: 8, padding: "8px 10px", textAlign: "left",
                  background: acc.bg, border: `0.5px solid ${acc.border}`,
                  cursor: "pointer", transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: acc.color, marginBottom: 1 }}>
                  {acc.label}
                </div>
                <div style={{ fontSize: 10, color: acc.color, opacity: 0.65 }}>
                  {acc.email}
                </div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "#cbd5e1", textAlign: "center", marginTop: 9 }}>
            Mật khẩu tất cả tài khoản demo: 123456
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}