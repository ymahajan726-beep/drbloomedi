

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;



  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/login" ||
    pathname === "/forgot-password"
  ) {
    return NextResponse.next();
  }

  
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/reception") ||
    pathname.startsWith("/patient")
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/reception/:path*",
    "/patient/:path*",
  ],
};