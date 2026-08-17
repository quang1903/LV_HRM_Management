"use client"

import { Topbar } from "@/components/hrm/topbar"
import { Sidebar } from "@/components/hrm/sidebar"
import { MyQRCode } from "@/components/hrm/my-qr-code"
import { MyProfileInfo } from "@/components/hrm/my-profile-info"
import { ChangePasswordForm } from "@/components/hrm/change-password-form"
import { MySalaryInfo } from "@/components/hrm/my-salary-info"
import { LeaveBalanceInfo } from "@/components/hrm/leave-balance-info"
import { Card } from "@/components/ui/card"

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Trang cá nhân</h2>
            <p className="text-sm text-muted-foreground">Xem và cập nhật thông tin của bạn</p>
          </div>

          <div className="flex flex-col gap-4">
            <MyProfileInfo />

            <LeaveBalanceInfo />

            <MySalaryInfo />

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Đổi mật khẩu</h3>
              <ChangePasswordForm />
            </Card>

            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <MyQRCode />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}