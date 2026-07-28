"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Briefcase, CheckCircle2, XCircle, Loader2, MapPin, KeyRound, Clock, QrCode, UserCheck } from "lucide-react"
import axios from "axios"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
const TERMINAL_TOKEN_KEY = "scan_terminal_token"

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ message: string; success: boolean; name?: string } | null>(null)
  const [history, setHistory] = useState<{ name: string; time: string; type?: "in" | "out" }[]>([])
  const lastScanRef = useRef<string>("")
  const cooldownRef = useRef(false)

  const [locationStatus, setLocationStatus] = useState<"checking" | "denied" | "ok" | "error">("checking")
  const [locationError, setLocationError] = useState("")
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null)

  // Terminal Token
  const [terminalToken, setTerminalToken] = useState<string | null>(null)
  const [showActivate, setShowActivate] = useState(false)
  const [activatePassword, setActivatePassword] = useState("")
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState("")

  // Kiểm tra token trong localStorage
  useEffect(() => {
    const token = localStorage.getItem(TERMINAL_TOKEN_KEY)
    if (token) {
      setTerminalToken(token)
    } else {
      setShowActivate(true)
    }
  }, [])

  // Xin quyền GPS
  useEffect(() => {
    if (!terminalToken) return
    if (!navigator.geolocation) {
      setLocationStatus("error")
      setLocationError("Thiết bị không hỗ trợ định vị")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        coordsRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setLocationStatus("ok")
      },
      (error) => {
        setLocationStatus("denied")
        setLocationError(error.message || "Không thể lấy vị trí, vui lòng cấp quyền định vị")
      },
      { enableHighAccuracy: true }
    )
  }, [terminalToken])

  // Mở camera
  useEffect(() => {
    if (locationStatus !== "ok" || !terminalToken) return
    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner

    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      return { width: viewfinderWidth, height: viewfinderHeight }
    }

    scanner.start(
      { facingMode: "environment" },
      {
        fps: 25,
        qrbox: qrboxFunction,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      },
      onScanSuccess,
      () => {}
    ).then(() => setScanning(true)).catch(err => {
      setResult({ message: "Không thể mở camera: " + err, success: false })
    })
    return () => { scanner.stop().catch(() => {}) }
  }, [locationStatus, terminalToken])

  const handleActivate = async () => {
    if (!activatePassword) {
      setActivateError("Vui lòng nhập mật khẩu")
      return
    }
    try {
      setActivating(true)
      setActivateError("")
      const res = await axios.post(`${API_URL}/settings/scan-activate`, { password: activatePassword })
      const token = res.data.token
      localStorage.setItem(TERMINAL_TOKEN_KEY, token)
      setTerminalToken(token)
      setShowActivate(false)
    } catch (err: any) {
      setActivateError(err.response?.data?.message || "Mật khẩu không đúng")
    } finally {
      setActivating(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    if (cooldownRef.current || decodedText === lastScanRef.current) return
    if (!coordsRef.current) return
    lastScanRef.current = decodedText
    cooldownRef.current = true
    setTimeout(() => { cooldownRef.current = false; lastScanRef.current = "" }, 2500)

    const { latitude, longitude } = coordsRef.current
    const token = localStorage.getItem(TERMINAL_TOKEN_KEY) || ""
    const headers = { "x-terminal-token": token }

    try {
      const res = await axios.post(`${API_URL}/attendances/checkin`,
        { qr_value: decodedText, latitude, longitude }, { headers })
      const time = new Date(res.data.check_in).toLocaleTimeString("vi-VN")
      setResult({ message: `Đã vào lúc ${time}`, success: true, name: res.data.full_name })
      setHistory(prev => [{ name: res.data.full_name, time: `Vào ${time}`, type: "in" }, ...prev].slice(0, 6))
      scannerRef.current?.pause(true)
      setTimeout(() => scannerRef.current?.resume(), 2000)
      setTimeout(() => setResult(null), 4000)
    } catch (err: any) {
      const msg = err.response?.data?.message || ""
      if (msg.includes("đã check-in")) {
        try {
          const res2 = await axios.post(`${API_URL}/attendances/checkout`,
            { qr_value: decodedText, latitude, longitude }, { headers })
          const time = new Date(res2.data.check_out).toLocaleTimeString("vi-VN")
          setResult({ message: `Đã ra lúc ${time}`, success: true, name: res2.data.full_name })
          setHistory(prev => [{ name: res2.data.full_name, time: `Ra ${time}`, type: "out" }, ...prev].slice(0, 6))
          scannerRef.current?.pause(true)
          setTimeout(() => scannerRef.current?.resume(), 2000)
          setTimeout(() => setResult(null), 4000)
        } catch (err2: any) {
          const msg2 = err2.response?.data?.message || ""
          if (msg2.includes("đã check-out") || msg2.includes("điểm danh")) {
            setResult({ message: `Đã điểm danh đủ hôm nay`, success: true, name: "" })
            scannerRef.current?.pause(true)
            setTimeout(() => scannerRef.current?.resume(), 2000)
            setTimeout(() => setResult(null), 4000)
          } else if (err2.response?.status === 401) {
            localStorage.removeItem(TERMINAL_TOKEN_KEY)
            setTerminalToken(null)
            setShowActivate(true)
          } else if (msg2.includes("check-in hợp lệ")) {
            setResult({ message: "Đã điểm danh đủ hôm nay", success: true, name: "" })
            scannerRef.current?.pause(true)
            setTimeout(() => scannerRef.current?.resume(), 2000)
            setTimeout(() => setResult(null), 4000)
          } else {
            setResult({ message: msg2 || "Lỗi xử lý", success: false })
            setTimeout(() => setResult(null), 4000)
          }
        }
      } else if (err.response?.status === 401) {
        localStorage.removeItem(TERMINAL_TOKEN_KEY)
        setTerminalToken(null)
        setShowActivate(true)
      } else {
        setResult({ message: msg || "Lỗi xử lý", success: false })
        setTimeout(() => setResult(null), 4000)
      }
    }
  }

  // Modal kích hoạt máy quét
  if (showActivate) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 mb-3">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-white text-lg font-bold">Kích hoạt máy quét</h2>
            <p className="text-slate-400 text-sm text-center mt-1">
              Nhập mật khẩu do Admin cài đặt để kích hoạt thiết bị này
            </p>
          </div>
          <input
            type="password"
            className="w-full h-11 rounded-lg bg-slate-800 border border-slate-700 px-3 text-white text-sm outline-none focus:ring-2 ring-primary/40 mb-3"
            placeholder="Mật khẩu máy quét..."
            value={activatePassword}
            onChange={e => setActivatePassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleActivate()}
          />
          {activateError && (
            <p className="text-rose-400 text-xs mb-3 text-center">{activateError}</p>
          )}
          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kích hoạt"}
          </button>
        </div>
      </div>
    )
  }

  if (locationStatus === "checking") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-slate-300">Đang xác định vị trí thiết bị...</p>
        </div>
      </div>
    )
  }

  if (locationStatus === "denied" || locationStatus === "error") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-sm">
          <MapPin className="h-10 w-10 mx-auto mb-3 text-rose-500" />
          <h2 className="text-lg font-semibold mb-2">Không thể xác định vị trí</h2>
          <p className="text-sm text-slate-300">{locationError}</p>
          <p className="text-xs text-slate-400 mt-3">Vui lòng cấp quyền truy cập vị trí cho trình duyệt và tải lại trang.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-6">
      {/* Khung Kiosk nguyên khối viền tối vừa vặn 1024px */}
      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Máy Chấm Công QR Code</h1>
              <p className="text-xs text-slate-400">Đưa mã QR trên ứng dụng lên trước camera</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-950 border border-slate-800 px-3.5 py-1.5 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Camera Kiosk sẵn sàng</span>
          </div>
        </div>

        {/* Bố cục Grid 2 Cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT TRÁI: KHUNG CAMERA QUÉT (Chiếm 7/12 cột, cao 380px) */}
          <div className="lg:col-span-7 flex flex-col">
            <style>{`
              #qr-reader {
                border: none !important;
                background: transparent !important;
              }
              #qr-reader video {
                object-fit: cover !important;
                width: 100% !important;
                height: 100% !important;
                border-radius: 1rem !important;
              }
              #qr-reader__scan_region {
                background: transparent !important;
              }
              #qr-reader__scan_region img, #qr-reader__scan_region div {
                display: none !important;
              }
              #qr-reader__dashboard {
                display: none !important;
              }
            `}</style>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner relative flex items-center justify-center" style={{ height: "380px" }}>
              <div id="qr-reader" className="w-full h-full" />
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs text-slate-400">Đang bật camera...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG BÁO RESULT + LỊCH SỬ CHẤM CÔNG (Chiếm 5/12 cột) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* THẺ THÔNG BÁO KẾT QUẢ CHECK-IN / CHECK-OUT */}
            <div className="w-full min-h-[120px]">
              {result ? (
                <div
                  className={`relative overflow-hidden rounded-2xl p-4 border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                    result.success
                      ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-100"
                      : "bg-rose-950/90 border-rose-500/60 text-rose-100"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        result.success ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {result.success ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {result.name && (
                        <h2 className="text-base font-bold truncate text-white leading-snug mb-0.5">{result.name}</h2>
                      )}
                      <p className="text-xs font-medium opacity-90 leading-relaxed">{result.message}</p>
                      <p className="text-[10px] opacity-60 mt-1.5">Tự động tắt sau 4s (tự ghi đè khi người mới quét)</p>
                    </div>
                  </div>

                  {/* Thanh đếm lùi 4 giây */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                    <div className={`h-full animate-[shrink_4s_linear_forwards] ${result.success ? "bg-emerald-400" : "bg-rose-400"}`} />
                  </div>
                </div>
              ) : (
                /* Thẻ trạng thái chờ khi chưa quét */
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 text-center flex flex-col items-center justify-center min-h-[120px] gap-1.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 mb-0.5">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200">Sẵn sàng nhận diện</h3>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Đưa mã QR trên màn hình điện thoại vào camera để điểm danh
                  </p>
                </div>
              )}
            </div>

            {/* BẢNG LỊCH SỬ CHẤM CÔNG GẦN ĐÂY */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-xs font-semibold text-slate-200">Lịch sử chấm công vừa quét</h3>
                </div>
                <span className="text-[11px] text-slate-500 tabular-nums">{history.length} lượt</span>
              </div>

              {history.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Chưa có lượt chấm công nào trong phiên này
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800/80 px-3 py-2 text-xs transition-colors hover:bg-slate-800/80"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                          <UserCheck className="h-3 w-3" />
                        </div>
                        <span className="font-medium text-slate-200 truncate">{h.name}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          h.type === "in"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {h.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
