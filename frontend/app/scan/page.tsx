"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Briefcase, CheckCircle2, XCircle, Loader2, MapPin, KeyRound } from "lucide-react"
import axios from "axios"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
const TERMINAL_TOKEN_KEY = "scan_terminal_token"

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ message: string; success: boolean; name?: string } | null>(null)
  const [history, setHistory] = useState<{ name: string; time: string }[]>([])
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
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 500, height: 500 } },
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
    setTimeout(() => { cooldownRef.current = false; lastScanRef.current = "" }, 3000)

    const { latitude, longitude } = coordsRef.current
    const token = localStorage.getItem(TERMINAL_TOKEN_KEY) || ""
    const headers = { "x-terminal-token": token }

    try {
      const res = await axios.post(`${API_URL}/attendances/checkin`, 
        { qr_value: decodedText, latitude, longitude }, { headers })
      const time = new Date(res.data.check_in).toLocaleTimeString("vi-VN")
      setResult({ message: `Đã vào lúc ${time}`, success: true, name: res.data.full_name })
      setHistory(prev => [{ name: res.data.full_name, time: `Vào ${time}` }, ...prev].slice(0, 8))
      scannerRef.current?.pause(true)
      setTimeout(() => scannerRef.current?.resume(), 3000)
      setTimeout(() => setResult(null), 2000)
    } catch (err: any) {
      const msg = err.response?.data?.message || ""
      if (msg.includes("đã check-in")) {
        try {
          const res2 = await axios.post(`${API_URL}/attendances/checkout`, 
            { qr_value: decodedText, latitude, longitude }, { headers })
          const time = new Date(res2.data.check_out).toLocaleTimeString("vi-VN")
          setResult({ message: `Đã ra lúc ${time}`, success: true, name: res2.data.full_name })
          setHistory(prev => [{ name: res2.data.full_name, time: `Ra ${time}` }, ...prev].slice(0, 8))
          scannerRef.current?.pause(true)
          setTimeout(() => scannerRef.current?.resume(), 3000)
          setTimeout(() => setResult(null), 2000)
        } catch (err2: any) {
          const msg2 = err2.response?.data?.message || ""
          if (msg2.includes("đã check-out") || msg2.includes("điểm danh")) {
            setResult({ message: `Đã điểm danh đủ hôm nay`, success: true, name: "" })
            scannerRef.current?.pause(true)
            setTimeout(() => scannerRef.current?.resume(), 3000)
            setTimeout(() => setResult(null), 2000)
          } else if (err2.response?.status === 401) {
            localStorage.removeItem(TERMINAL_TOKEN_KEY)
            setTerminalToken(null)
            setShowActivate(true)
          } else if (msg2.includes("check-in hợp lệ")) {
            setResult({ message: "Đã điểm danh đủ hôm nay", success: true, name: "" })
            scannerRef.current?.pause(true)
            setTimeout(() => scannerRef.current?.resume(), 3000)
            setTimeout(() => setResult(null), 2000)
          } else {
            setResult({ message: msg2 || "Lỗi xử lý", success: false })
          }
        }
      } else if (err.response?.status === 401) {
        // Token hết hạn hoặc không hợp lệ
        localStorage.removeItem(TERMINAL_TOKEN_KEY)
        setTerminalToken(null)
        setShowActivate(true)
      } else {
        setResult({ message: msg || "Lỗi xử lý", success: false })
      }
    }
  }

  // Modal kích hoạt máy quét
  if (showActivate) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 shadow-2xl">
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
            className="w-full h-10 rounded-lg bg-slate-700 border border-slate-600 px-3 text-white text-sm outline-none focus:ring-2 ring-primary/40 mb-3"
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
            className="w-full h-10 rounded-lg bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kích hoạt"}
          </button>
        </div>
      </div>
    )
  }

  if (locationStatus === "checking") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300">Đang xác định vị trí thiết bị...</p>
        </div>
      </div>
    )
  }

  if (locationStatus === "denied" || locationStatus === "error") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Máy chấm công</h1>
            <p className="text-sm text-slate-300">Đưa mã QR lên camera</p>
          </div>
        </div>

        <div className="bg-black rounded-lg overflow-hidden w-full relative" style={{ height: "600px" }} >
          <div id="qr-reader" className="w-full h-full" />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {result && (
          <div className={`mt-4 rounded-lg p-4 text-center ${result.success ? "bg-emerald-600" : "bg-rose-600"} text-white`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              {result.success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {result.name && <span className="font-semibold">{result.name}</span>}
            </div>
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 mt-4">
            <h3 className="text-white font-semibold mb-2 text-sm">Lịch sử quét gần đây</h3>
            <div className="flex flex-col gap-1">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-slate-200 border-b border-slate-700 pb-1">
                  <span>{h.name}</span>
                  <span className="text-slate-400">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
