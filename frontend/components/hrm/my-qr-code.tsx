"use client"

import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, QrCode, RefreshCw } from "lucide-react"
import { employeeService } from "@/services/employee"
import { useAuth } from "@/context/AuthContext"

export function MyQRCode() {
  // Lấy thông tin user hiện tại từ AuthContext
  const { user } = useAuth()
  // Khởi tạo state để lưu trữ ảnh QR Code (dạng DataURL - Base64)
  const [qrImage, setQrImage] = useState<string>("")
  // Khởi tạo state để đếm ngược thời gian còn lại trước khi mã QR hết hạn (mặc định 30 giây)
  const [secondsLeft, setSecondsLeft] = useState(30)
  // State để xử lý trạng thái tải (loading)
  const [loading, setLoading] = useState(true)
  // State để lưu trữ thông báo lỗi
  const [error, setError] = useState<string | null>(null)
  // State kiểm tra mã đã hết hạn hay chưa
  const [expired, setExpired] = useState(false)
  // State kiểm tra trạng thái làm mới (refreshing)
  const [refreshing, setRefreshing] = useState(false)
  // State để đếm số lần gọi API lấy mã QR (để trigger useEffect đếm ngược)
  const [fetchCount, setFetchCount] = useState(0)
  // Ref để lưu ID của setInterval, giúp quản lý và clear interval
  const intervalRef = useRef<any>(null)

  // 1. HÀM TẠO MÃ QR: Lấy chuỗi mã hóa từ Backend và chuyển thành ảnh DataURL (Base64)
  const fetchQR = async (isManual = false) => {
    if (isManual) {
      if (refreshing) return
      setRefreshing(true)
      setTimeout(() => setRefreshing(false), 3000)
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
    try {
      setExpired(false)
      const res = await employeeService.getMyQR()
      const dataUrl = await QRCode.toDataURL(res.data.qr_value, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" }
      })
      setQrImage(dataUrl)
      setSecondsLeft(30) // Reset đồng hồ về 30 giây
      setFetchCount(prev => prev + 1)
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
    fetchQR(false)
  }, [user])

   // ĐỒNG HỒ ĐẾM NGƯỢC 30 GIÂY: Khi hết 30 giây tự động gọi fetchQR() lấy mã mới
  useEffect(() => {
    if (!qrImage || expired) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          fetchQR(false)// Tự đổi mã khi hết thời gian
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [qrImage, expired, fetchCount])

  const handleRefresh = () => {
    if (refreshing || loading) return
    setLoading(true)
    fetchQR(true)
  }

  return (
    <Card className="p-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Mã QR chấm công</h3>
      </div>

      {/* Hiển thị ảnh QR Code & Thanh tiến trình 30s */}
      {loading ? (
        <div className="h-[220px] w-[220px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        // Hiển thị thông báo lỗi
      ) : error ? (
        <div className="h-[220px] w-[220px] flex items-center justify-center text-center text-sm text-muted-foreground px-4">
          {error}
        </div>
      ) : (
        // Hiển thị ảnh QR Code
        <div className="relative">
          <img
            src={qrImage}
            alt="QR Code"
            className={`rounded-md border border-border ${expired ? "opacity-20 blur-sm" : ""}`}
          />
          {/* Hiển thị nút bấm tạo mã mới khi mã đã hết hạn */}
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

      {/* Thanh tiến trình 30 giây */}
      {!error && !expired && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / 30) * 100}%` }}
            />
          </div>
          {/* Đếm ngược thời gian còn lại */}
          <span className="text-xs text-muted-foreground tabular-nums">{secondsLeft}s</span>
        </div>
      )}

      {/* Hiển thị thông báo hết hạn */}
      {!error && expired && (
        <p className="text-xs text-rose-600 mt-3 text-center">Mã đã hết hạn, bấm "Tạo mã mới" để tiếp tục</p>
      )}

      {/* Hướng dẫn sử dụng */}
      {!error && !expired && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Đưa mã này lên camera máy chấm công tại cổng. Mã tự hết hạn sau 30 giây để bảo mật.
        </p>
      )}
      {/* Nút bấm tạo mã mới */}
      {!error && !expired && !loading && !refreshing && (
        <button
          onClick={handleRefresh}
          className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          🔄 Tạo mã mới
        </button>
      )}
    </Card>
  )
}