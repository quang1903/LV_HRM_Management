"use client"

import { useState } from "react"
import { Clock, CheckCircle2, LogIn, LogOut, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function MyAttendanceCard() {
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleCheckIn = () => {
    setLoading(true)
    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      setCheckInTime(nowStr)
      setMsg(`✅ Đã điểm danh Check-in vào lúc ${nowStr}!`)
      setLoading(false)
      setTimeout(() => setMsg(null), 4000)
    }, 400)
  }

  const handleCheckOut = () => {
    setLoading(true)
    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      setCheckOutTime(nowStr)
      setMsg(`✅ Đã điểm danh Check-out ra lúc ${nowStr}!`)
      setLoading(false)
      setTimeout(() => setMsg(null), 4000)
    }, 400)
  }

  const getStatusBadge = () => {
    if (!checkInTime) {
      return (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Chưa điểm danh vào
        </span>
      )
    }
    if (checkInTime && !checkOutTime) {
      return (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Đã Check-in ({checkInTime})
        </span>
      )
    }
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Đã hoàn thành điểm danh
      </span>
    )
  }

  return (
    <Card className="p-6 border-slate-200 shadow-sm relative overflow-hidden bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-base">Nút Chấm công / Điểm danh cá nhân</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">Giao diện phòng hờ</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Bấm nút trực tiếp để ghi nhận thời gian điểm danh trong ngày</p>
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-lg text-xs mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium mb-1">Giờ Check-in vào</div>
          <div className="text-lg font-bold text-slate-800">
            {checkInTime || "--:--"}
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium mb-1">Giờ Check-out ra</div>
          <div className="text-lg font-bold text-slate-800">
            {checkOutTime || "--:--"}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2">
          {!checkInTime ? (
            <Button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all flex items-center justify-center gap-2 h-10"
            >
              <LogIn className="w-4 h-4" />
              <span>Điểm danh Check-in</span>
            </Button>
          ) : !checkOutTime ? (
            <Button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all flex items-center justify-center gap-2 h-10"
            >
              <LogOut className="w-4 h-4" />
              <span>Điểm danh Check-out</span>
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              className="w-full bg-slate-100 text-slate-500 border-slate-200 cursor-default flex items-center justify-center gap-2 h-10"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Hoàn thành hôm nay</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
