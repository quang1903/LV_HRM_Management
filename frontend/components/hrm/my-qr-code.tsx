"use client"

import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, QrCode, RefreshCw } from "lucide-react"
import { employeeService } from "@/services/employee"
import { useAuth } from "@/context/AuthContext"

export function MyQRCode() {
  const { user } = useAuth()
  const [qrImage, setQrImage] = useState<string>("")
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const intervalRef = useRef<any>(null)

  const fetchQR = async () => {
    try {
      setExpired(false)
      const res = await employeeService.getMyQR()
      const dataUrl = await QRCode.toDataURL(res.data.qr_value, { width: 220, margin: 1 })
      setQrImage(dataUrl)
      setSecondsLeft(res.data.expires_in)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tạo mã QR")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.employee_id) {
      setLoading(false)
      setError("Tài khoản chưa gắn với hồ sơ nhân viên, không có mã QR chấm công")
      return
    }

    fetchQR()
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [user])

  const handleRefresh = () => {
    setLoading(true)
    fetchQR().finally(() => {
      // Khởi động lại đồng hồ đếm ngược
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setExpired(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    })
  }

  return (
    <Card className="p-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Mã QR chấm công</h3>
      </div>

      {loading ? (
        <div className="h-[220px] w-[220px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="h-[220px] w-[220px] flex items-center justify-center text-center text-sm text-muted-foreground px-4">
          {error}
        </div>
      ) : (
        <div className="relative">
          <img
            src={qrImage}
            alt="QR Code"
            className={`rounded-md border border-border ${expired ? "opacity-20 blur-sm" : ""}`}
          />
          {expired && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="sm" className="gap-2" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
                Tạo mã mới
              </Button>
            </div>
          )}
        </div>
      )}

      {!error && !expired && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / 30) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{secondsLeft}s</span>
        </div>
      )}

      {!error && expired && (
        <p className="text-xs text-rose-600 mt-3 text-center">Mã đã hết hạn, bấm "Tạo mã mới" để tiếp tục</p>
      )}

      {!error && !expired && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Đưa mã này lên camera máy chấm công tại cổng. Mã tự hết hạn sau 30 giây để bảo mật.
        </p>
      )}
    </Card>
  )
}