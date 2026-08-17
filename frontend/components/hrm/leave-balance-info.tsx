"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, CalendarDays } from "lucide-react"
import { leaveService } from "@/services/leave"

export function LeaveBalanceInfo() {
  const [balance, setBalance] = useState<{ total: number; used: number; remaining: number; year: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leaveService.getBalance()
      .then(res => setBalance(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (!balance) return null

  const percentUsed = balance.total > 0 ? (balance.used / balance.total) * 100 : 0

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Quỹ phép năm {balance.year}</h3>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold text-primary">{balance.remaining}</span>
        <span className="text-sm text-muted-foreground mb-1">/ {balance.total} ngày còn lại</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentUsed}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Đã sử dụng {balance.used} / {balance.total} ngày phép năm
      </p>
    </Card>
  )
}
