// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * IMPORTANT
   * ----------
   * Middleware browser ke sessionStorage ko access nahi kar sakta.
   *
   * sessionStorage per browser TAB hota hai.
   * Cookies browser-wide/shared hoti hain.
   *
   * Isliye Admin, Doctor aur Reception ke parallel sessions
   * ko middleware ke cookie-based token/role se validate nahi karna hai.
   *
   * Active session validation client-side guards aur backend API
   * Authorization header ke through handle hogi.
   */

  // ------------------------------------------------------------
  // 1. PUBLIC / NEXT.JS INTERNAL ROUTES
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // 2. PROTECTED APPLICATION ROUTES
  // ------------------------------------------------------------
  //
  // Middleware yahan token ya role cookie check nahi karega.
  //
  // Reason:
  // Middleware sessionStorage nahi padh sakta.
  //
  // Example:
  //
  // Tab 1 -> Admin
  // Tab 2 -> Doctor
  // Tab 3 -> Reception
  //
  // Agar middleware shared cookie check karega to ek tab ka login
  // doosre tab ke session ko affect kar sakta hai.
  //
  // Isliye request ko allow kar rahe hain.
  // Client-side role guards current TAB ka sessionStorage check karenge.
  //

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/reception") ||
    pathname.startsWith("/patient")
  ) {
    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // 3. ALL OTHER ROUTES
  // ------------------------------------------------------------

  return NextResponse.next();
}

// ------------------------------------------------------------
// 4. MIDDLEWARE MATCHER
// ------------------------------------------------------------

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/reception/:path*",
    "/patient/:path*",
  ],
};