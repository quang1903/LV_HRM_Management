"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Briefcase, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import axios from "axios"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ message: string; success: boolean; name?: string } | null>(null)
  const [history, setHistory] = useState<{ name: string; time: string }[]>([])
  const lastScanRef = useRef<string>("")
  const cooldownRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      onScanSuccess,
      () => {}
    ).then(() => setScanning(true)).catch(err => {
      setResult({ message: "Không thể mở camera: " + err, success: false })
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  const onScanSuccess = async (decodedText: string) => {
    if (cooldownRef.current || decodedText === lastScanRef.current) return
    lastScanRef.current = decodedText
    cooldownRef.current = true
    setTimeout(() => { cooldownRef.current = false; lastScanRef.current = "" }, 3000)

    try {
      // Thử check-in trước, nếu đã check-in thì tự check-out
      const res = await axios.post(`${API_URL}/attendances/checkin`, { qr_value: decodedText })
      const time = new Date(res.data.check_in).toLocaleTimeString("vi-VN")
      setResult({ message: `Check-in lúc ${time}`, success: true, name: res.data.full_name })
      setHistory(prev => [{ name: res.data.full_name, time: `Vào ${time}` }, ...prev].slice(0, 8))
    } catch (err: any) {
      const msg = err.response?.data?.message || ""
      if (msg.includes("đã check-in")) {
        try {
          const res2 = await axios.post(`${API_URL}/attendances/checkout`, { qr_value: decodedText })
          const time = new Date(res2.data.check_out).toLocaleTimeString("vi-VN")
          setResult({ message: `Check-out lúc ${time}`, success: true, name: res2.data.full_name })
          setHistory(prev => [{ name: res2.data.full_name, time: `Ra ${time}` }, ...prev].slice(0, 8))
        } catch (err2: any) {
          setResult({ message: err2.response?.data?.message || "Lỗi xử lý", success: false })
        }
      } else {
        setResult({ message: msg || "Lỗi xử lý", success: false })
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Máy chấm công</h1>
            <p className="text-sm text-slate-300">Đưa mã QR lên camera</p>
          </div>
        </div>

        <div className="bg-black rounded-lg overflow-hidden aspect-square relative">
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
