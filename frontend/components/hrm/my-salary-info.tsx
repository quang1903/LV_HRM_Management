"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, Wallet } from "lucide-react"
import { reportService } from "@/services/report"
import { cn } from "@/lib/utils"

export function MySalaryInfo() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [month, year])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await reportService.getMySalary(month, year)
      setData(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải phiếu lương")
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (n: any) => Number(n || 0).toLocaleString("vi-VN")
  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear()

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Phiếu lương của tôi</h3>
          {!loading && data && (
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              isCurrentMonth ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
            )}>
              {isCurrentMonth ? "⏳ Tạm tính" : "✓ Chính thức"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
            value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground text-center py-8">{error}</p>
      ) : data ? (
        <div className="flex flex-col gap-3">
          {!data.has_contract && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 mb-1">
              ⚠ Bạn chưa có hợp đồng lao động đang hiệu lực. Vui lòng liên hệ HR để được cấp hợp đồng.
            </div>
          )}
          {[
            { label: "Loại hợp đồng", value: data.contract_type || "—" },
            { label: "Lương cơ bản", value: `${formatMoney(data.base_salary)} đ` },
            { label: "Ngày công thực tế", value: `${data.work_days} ngày` },
            { label: "— Đúng giờ", value: `${data.ontime_days || 0} ngày` },
            { label: "— Đi trễ", value: `${data.late_days || 0} ngày` },
            { label: "— Về sớm", value: `${data.early_leave_days || 0} ngày` },
            { label: "Ngày công bổ sung (phạt 20%)", value: `${data.penalty_days || 0} ngày` },
            { label: "Ngày nghỉ phép (có lương)", value: `${data.leave_days} ngày` },
            { label: "Tổng giờ làm việc", value: `${data.total_work_hours || "0.0"} giờ` },
            { label: "Giờ tăng ca", value: `${((data.overtime_minutes || 0) / 60).toFixed(1)} giờ` },
            { label: "Tiền tăng ca (x1.5)", value: `${formatMoney(data.overtime_pay)} đ` },
            { label: "Vắng không phép", value: `${data.unexcused_absent} ngày` },
          ].map(item => (
            <div key={item.label} className="flex justify-between border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center mt-2 rounded-lg bg-primary/5 p-4">
            <span className="font-semibold">Lương thực nhận</span>
            <span className="text-xl font-bold text-primary">{formatMoney(data.actual_salary)} đ</span>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
