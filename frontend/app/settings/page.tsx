"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, Lock, Unlock, ScanLine } from "lucide-react"
import { settingsService } from "@/services/settings"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function SettingsPage() {
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [maxDistance, setMaxDistance] = useState("500")
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const [deviceLockEnabled, setDeviceLockEnabled] = useState(false)
  const [savingDeviceLock, setSavingDeviceLock] = useState(false)
  const [scanPassword, setScanPassword] = useState("")
  const [savingScanPassword, setSavingScanPassword] = useState(false)

  useEffect(() => {
    settingsService.get().then(res => {
      if (res.data.company_lat) {
        setLat(String(res.data.company_lat))
        setLng(String(res.data.company_lng))
        setMaxDistance(String(res.data.max_distance || 500))
      }
      setDeviceLockEnabled(!!res.data.device_lock_enabled)
    }).catch(() => {})
  }, [])

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị")
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(String(position.coords.latitude))
        setLng(String(position.coords.longitude))
        setGettingLocation(false)
      },
      (error) => {
        alert("Không lấy được vị trí: " + error.message)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSave = async () => {
    if (!lat || !lng) {
      alert("Vui lòng nhập hoặc lấy vị trí trước")
      return
    }
    try {
      setLoading(true)
      await settingsService.update({
        company_lat: Number(lat),
        company_lng: Number(lng),
        max_distance: Number(maxDistance),
      })
      alert("Đã lưu vị trí công ty!")
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi lưu")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDeviceLock = async () => {
    const newValue = !deviceLockEnabled
    try {
      setSavingDeviceLock(true)
      await settingsService.updateDeviceLock(newValue)
      setDeviceLockEnabled(newValue)
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật Device Lock")
    } finally {
      setSavingDeviceLock(false)
    }
  }

  const handleSaveScanPassword = async () => {
    if (!scanPassword) {
      alert("Vui lòng nhập mật khẩu máy quét")
      return
    }
    try {
      setSavingScanPassword(true)
      await axios.post(`${API_URL}/settings/scan-password`, 
        { scan_password: scanPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem("hrm_access_token")}` } }
      )
      alert("Đã lưu mật khẩu máy quét!")
      setScanPassword("")
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi lưu")
    } finally {
      setSavingScanPassword(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Cài đặt hệ thống</h2>
            <p className="text-sm text-muted-foreground">Vị trí công ty và bảo mật thiết bị</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-3">Vị trí công ty</h3>
            <Button
              variant="outline"
              className="w-full gap-2 mb-4"
              onClick={handleGetCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {gettingLocation ? "Đang lấy vị trí..." : "Lấy vị trí hiện tại của tôi"}
            </Button>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Vĩ độ (Latitude)</label>
                <input
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="VD: 10.762622"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Kinh độ (Longitude)</label>
                <input
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                  value={lng}
                  onChange={e => setLng(e.target.value)}
                  placeholder="VD: 106.660172"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Bán kính cho phép (mét)</label>
                <input
                  type="number"
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                  value={maxDistance}
                  onChange={e => setMaxDistance(e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full mt-4" onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Lưu cài đặt
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              {deviceLockEnabled ? <Lock className="h-4 w-4 text-emerald-600" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
              <h3 className="text-sm font-semibold">Khóa thiết bị (Device Lock)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Chỉ cho phép đăng nhập từ 1 thiết bị duy nhất cho mỗi tài khoản (trừ Admin). Tắt khi cần test trên nhiều máy, bật khi demo thật.
            </p>

            <button
              type="button"
              onClick={handleToggleDeviceLock}
              disabled={savingDeviceLock}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                deviceLockEnabled ? "bg-primary" : "bg-muted-foreground/30"
              } ${savingDeviceLock ? "opacity-50" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  deviceLockEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="ml-3 text-sm font-medium">
              {deviceLockEnabled ? "Đang bật" : "Đang tắt"}
            </span>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <ScanLine className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Mật khẩu máy quét</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Đặt mật khẩu để kích hoạt trang /scan tại máy quét cổng công ty. 
              Nhân viên không biết mật khẩu này sẽ không thể sử dụng máy quét.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 ring-ring/40"
                placeholder="Nhập mật khẩu mới..."
                value={scanPassword}
                onChange={e => setScanPassword(e.target.value)}
              />
              <Button onClick={handleSaveScanPassword} disabled={savingScanPassword} size="sm">
                {savingScanPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
              </Button>
            </div>
          </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
