"use client"

import { Users, UserCheck, CalendarDays, FileWarning, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  data: {
    employees: any[]
    attendance: any[]
    leaves: any[]
    contracts: any[]
  } | null
}

export function StatCards({ data }: Props) {
  const loading = !data

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  // 1. TÍNH TOÁN 4 THÔNG SỐ CHÍNH CHO CÁC THẺ DASHBOARD
  // Đếm số nhân viên đang làm việc
  const totalEmployees = (data?.employees || []).filter((e: any) => e.status === "Dang lam").length
  // Đếm số nhân viên đã check-in trong ngày hôm nay
  const todayAttendance = (data?.attendance || []).filter((a: any) => a.work_date?.substring(0, 10) === today && a.check_in).length
  // Đếm số đơn nghỉ phép đang chờ duyệt
  const pendingLeaves = (data?.leaves || []).filter((l: any) => l.status === "Cho duyet").length
  // Đếm số hợp đồng sắp hết hạn
  const expiringContracts = data?.contracts?.length ?? 0
  // Tính tỉ lệ chấm công hôm nay
  const attendanceRate = totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0

  const stats = [
    {
      label: "Tổng nhân viên",
      value: totalEmployees,
      hint: "Đang làm việc",
      trend: { label: "active", up: true },
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      Icon: Users,
    },
    {
      label: "Đi làm hôm nay",
      value: todayAttendance,
      hint: `Tỷ lệ chấm công ${attendanceRate}%`,
      trend: { label: `${attendanceRate}%`, up: attendanceRate > 0 },
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      Icon: UserCheck,
    },
    {
      label: "Đơn chờ duyệt",
      value: pendingLeaves,
      hint: "Nghỉ phép chờ phê duyệt",
      trend: { label: pendingLeaves > 0 ? `${pendingLeaves} đơn` : "0 đơn", up: false },
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      Icon: CalendarDays,
    },
    {
      label: "HĐ sắp hết hạn",
      value: expiringContracts,
      hint: "Trong 30 ngày tới",
      trend: { label: expiringContracts > 0 ? `${expiringContracts} HĐ` : "Không có", up: false },
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      Icon: FileWarning,
    },
  ]

  return (
    // 2. RENDER LAYOUT 4 THẺ
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* DUYỆT MẢNG stats ĐỂ VẼ 4 CÁI HỘP */}
      {stats.map((stat) => {
        const TrendIcon = stat.trend.up ? ArrowUpRight : ArrowDownRight
        return (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow duration-150"
          >
            <div className="flex items-center justify-between">
              {/* Biến đổi màu nền và icon theo từng loại thẻ */}
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", stat.iconBg)}>
                <stat.Icon className={cn("h-[18px] w-[18px]", stat.iconColor)} />
              </div>
              {/* Hiển thị mũi tên lên/xuống và con số % hoặc tên trạng thái */}
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  stat.trend.up ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {stat.trend.label}
              </span>
              {/* Vòng lặp hoàn tất - chuyển sang hiển thị nội dung */}
            </div>
            <div>
              {/* Tiêu đề (VD: "Tổng nhân viên", "Đi làm hôm nay") */}
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
              {/* Giá trị chính (Con số hoặc % )*/}
              <p className="mt-1 text-[28px] font-bold tracking-tight text-foreground leading-none">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                ) : (
                  stat.value
                )}
              </p>
              {/* Dòng mô tả phụ (VD: "Đang làm việc", "Trong 30 ngày tới") */}
              <p className="mt-1.5 text-[11px] text-muted-foreground/60">{stat.hint}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}