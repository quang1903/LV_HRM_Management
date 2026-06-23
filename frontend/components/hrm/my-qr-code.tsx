"use client"

import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"
import { Card } from "@/components/ui/card"
import { Loader2, QrCode } from "lucide-react"
import { employeeService } from "@/services/employee"

export function MyQRCode() {
  const [qrImage, setQrImage] = useState<string>("")
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<any>(null)

  const fetchQR = async () => {
    try {
      const res = await employeeService.getMyQR()
      const dataUrl = await QRCode.toDataURL(res.data.qr_value, { width: 220, margin: 1 })
      setQrImage(dataUrl)
      setSecondsLeft(res.data.expires_in)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQR()
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          fetchQR()
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <Card className="p-6 flex flex-col items-center max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Mã QR chấm công</h3>
      </div>

      {loading ? (
        <div className="h-[220px] w-[220px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <img src={qrImage} alt="QR Code" className="rounded-md border border-border" />
      )}

      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsLeft / 30) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{secondsLeft}s</span>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Đưa mã này lên camera máy chấm công tại cổng. Mã tự đổi mỗi 30 giây để bảo mật.
      </p>
    </Card>
  )
}
