"use client"

import { Topbar } from "@/components/hrm/topbar"
import { Sidebar } from "@/components/hrm/sidebar"
import { MyQRCode } from "@/components/hrm/my-qr-code"
import { MyProfileInfo } from "@/components/hrm/my-profile-info"
import { ChangePasswordForm } from "@/components/hrm/change-password-form"
import { Card } from "@/components/ui/card"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Trang cá nhân</h1>

          <div className="flex flex-col gap-4">
            <MyProfileInfo />

            <Card className="p-6 max-w-2xl">
              <h3 className="font-semibold mb-4">Đổi mật khẩu</h3>
              <ChangePasswordForm />
            </Card>

            <div className="flex flex-col lg:flex-row gap-4">
              <MyQRCode />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
