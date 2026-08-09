"use client"

import { useState } from "react"
import { Clock, LogIn, LogOut, Loader2, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { attendanceService } from "@/services/attendance"

export function CheckinButton() {
  //Biến trạng thái hiển thị 
  const [loading, setLoading] = useState<"in" | "out" | null>(null)
  //Lưu trữ thông báo thành công/thất bại
  const [result, setResult] = useState<{ type: string; message: string; success: boolean } | null>(null)

  // 1. LẤY TỌA ĐỘ GPS TỪ TRÌNH DUYỆT (với độ chính xác cao enableHighAccuracy: true)
  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Trình duyệt không hỗ trợ định vị"))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error("Không lấy được vị trí: " + err.message)),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  // XỬ LÝ CHẤM CÔNG VÀO (Check-in)
  const handleCheckIn = async () => {
    try {
      setLoading("in")
      setResult(null)
      const { lat, lng } = await getLocation()
      const res = await attendanceService.selfCheckIn(lat, lng)
      setResult({ type: "in", message: `Check-in thành công! ${res.data.status === "Dung gio" ? "Đúng giờ ✅" : "Đi trễ ⚠️"}`, success: true })
    } catch (err: any) {
      setResult({ type: "in", message: err.response?.data?.message || err.message || "Lỗi check-in", success: false })
    } finally {
      setLoading(null)
    }
  }

  // XỬ LÝ CHẤM CÔNG RA (Check-out)
  const handleCheckOut = async () => {
    try {
      setLoading("out")
      setResult(null)
      const { lat, lng } = await getLocation()
      const res = await attendanceService.selfCheckOut(lat, lng)
      const hours = Math.floor(res.data.work_minutes / 60)
      const mins = res.data.work_minutes % 60
      setResult({ type: "out", message: `Check-out thành công! Tổng giờ làm: ${hours}h${mins}p`, success: true })
    } catch (err: any) {
      setResult({ type: "out", message: err.response?.data?.message || err.message || "Lỗi check-out", success: false })
    } finally {
      setLoading(null)
    }
  }

  {/* Hiển thị thông báo thành công / thất bại (ví dụ: Báo Đi trễ hoặc Không ở phạm vi công ty) */}
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Chấm công hôm nay</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 gap-2"
          onClick={handleCheckIn}
          disabled={loading !== null}
        >
          {loading === "in" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Chấm công vào
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleCheckOut}
          disabled={loading !== null}
        >
          {loading === "out" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Chấm công ra
        </Button>
      </div>

      {result && (
        <div className={`mt-3 rounded-md p-3 text-sm flex items-start gap-2 ${
          result.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        }`}>
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{result.message}</span>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Hệ thống sẽ kiểm tra vị trí của bạn để xác nhận chấm công tại công ty
      </p>
    </Card>
  )
}
