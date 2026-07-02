"use client"

import { useEffect, useState } from "react"
import { Users, UserCheck, CalendarDays, FileWarning, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { employeeService } from "@/services/employee"
import { attendanceService } from "@/services/attendance"
import { leaveService } from "@/services/leave"
import { contractService } from "@/services/contract"

export function StatCards() {
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [todayAttendance, setTodayAttendance] = useState(0)
  const [pendingLeaves, setPendingLeaves] = useState(0)
  const [expiringContracts, setExpiringContracts] = useState(0)

  useEffect(() => {
    if (isLoading || !user) return
    fetchStats()
  }, [user, isLoading])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const today = new Date()
      const month = today.getMonth() + 1
      const year = today.getFullYear()
      const todayStr = today.toISOString().split("T")[0]

      const [empRes, attRes, leaveRes, contractRes] = await Promise.all([
        employeeService.getAll().catch(() => ({ data: [] })),
        attendanceService.getAll({ month, year }).catch(() => ({ data: [] })),
        leaveService.getAll().catch(() => ({ data: [] })),
        user?.role !== "employee"
          ? contractService.getExpiring().catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ])

      setTotalEmployees(empRes.data.filter((e: any) => e.status === "Dang lam").length)
      setTodayAttendance(attRes.data.filter((a: any) => a.work_date?.substring(0, 10) === todayStr && a.check_in).length)
      setPendingLeaves(leaveRes.data.filter((l: any) => l.status === "Cho duyet").length)
      setExpiringContracts(contractRes.data.length)
    } catch (err) {
      console.error("Lỗi tải stat cards:", err)
    } finally {
      setLoading(false)
    }
  }

  const attendanceRate = totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0

  const stats = [
    {
      label: "Tổng nhân viên",
      value: loading ? null : totalEmployees,
      hint: "Đang làm việc",
      trend: { label: "active", up: true },
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      Icon: Users,
    },
    {
      label: "Đi làm hôm nay",
      value: loading ? null : todayAttendance,
      hint: `Tỷ lệ chấm công ${attendanceRate}%`,
      trend: { label: `${attendanceRate}%`, up: attendanceRate > 0 },
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      Icon: UserCheck,
    },
    {
      label: "Đơn chờ duyệt",
      value: loading ? null : pendingLeaves,
      hint: "Nghỉ phép chờ phê duyệt",
      trend: { label: pendingLeaves > 0 ? `${pendingLeaves} đơn` : "0 đơn", up: false },
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      Icon: CalendarDays,
    },
    {
      label: "HĐ sắp hết hạn",
      value: loading ? null : expiringContracts,
      hint: "Trong 30 ngày tới",
      trend: { label: expiringContracts > 0 ? `${expiringContracts} HĐ` : "Không có", up: false },
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      Icon: FileWarning,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const TrendIcon = stat.trend.up ? ArrowUpRight : ArrowDownRight
        return (
          <div key={stat.label}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center justify-between">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", stat.iconBg)}>
                <stat.Icon className={cn("h-[18px] w-[18px]", stat.iconColor)} />
              </div>
              <span className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                stat.trend.up
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              )}>
                <TrendIcon className="h-3 w-3" />
                {stat.trend.label}
              </span>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-[28px] font-bold tracking-tight text-foreground leading-none">
                {stat.value === null
                  ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  : stat.value}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground/60">{stat.hint}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}