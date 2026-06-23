import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "/employees":   ["admin", "hr", "manager"],
  "/departments": ["admin", "hr"],
  "/contracts":   ["admin", "hr", "manager"],
  "/reports":     ["admin", "hr", "manager"],
  "/attendance":  ["admin", "hr", "manager", "employee"],
  "/leave":       ["admin", "hr", "manager", "employee"],
  "/users":       ["admin"],
  "/":            ["admin", "hr", "manager", "employee"],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next()

  const userCookie = request.cookies.get("hrm_user")?.value
  if (!userCookie) {
    if (pathname === "/login") return NextResponse.next()
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (pathname === "/login") return NextResponse.redirect(new URL("/", request.url))

  try {
    const user = JSON.parse(decodeURIComponent(userCookie))
    const role = user?.role
    const matchedRoute = Object.keys(ROLE_PERMISSIONS).find(route => {
      if (route === "/") return pathname === "/"
      return pathname === route || pathname.startsWith(route + "/")
    })
    if (matchedRoute) {
      const allowed = ROLE_PERMISSIONS[matchedRoute]
      if (!allowed.includes(role)) return NextResponse.redirect(new URL("/", request.url))
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}