"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/hrm/sidebar"
import { Topbar } from "@/components/hrm/topbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2 } from "lucide-react"
import { settingsService } from "@/services/settings"

export default function SettingsPage() {
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [maxDistance, setMaxDistance] = useState("500")
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    settingsService.get().then(res => {
      if (res.data.company_lat) {
        setLat(String(res.data.company_lat))
        setLng(String(res.data.company_lng))
        setMaxDistance(String(res.data.max_distance || 500))
      }
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

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Cài đặt vị trí công ty</h2>
            <p className="text-sm text-muted-foreground">Dùng để xác thực GPS khi nhân viên chấm công qua app</p>
          </div>

          <Card className="p-6 max-w-md">
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
        </main>
      </div>
    </div>
  )
}
