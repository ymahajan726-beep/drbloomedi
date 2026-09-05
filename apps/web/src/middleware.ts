import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static फ़ाइल्स, Next.js इंटरनल्स, API और पब्लिक रूट्स छोड़ें
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/login' ||
    pathname === '/forgot-password'
  ) {
    return NextResponse.next();
  }

  // 2. Cookie से टोकन और रोल निकालें
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('userRole')?.value?.toUpperCase();

  // 3. अगर टोकन नहीं है -> तुरंत लॉगिन पेज पर भेजें (कोई भी रूट नहीं खुलेगा)
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. DOCTOR ROUTES GUARD
  if (pathname.startsWith('/doctor')) {
    if (role !== 'DOCTOR') {
      return getRoleRedirect(role, request.url);
    }
  }

  // 5. RECEPTION DESK ROUTES GUARD
  if (pathname.startsWith('/reception')) {
    if (role !== 'RECEPTION' && role !== 'ADMIN') {
      return getRoleRedirect(role, request.url);
    }
  }

  // 6. PATIENT PORTAL GUARD
  if (pathname.startsWith('/patient')) {
    if (role !== 'PATIENT') {
      return getRoleRedirect(role, request.url);
    }
  }

  // 7. ADMIN SUB-ROUTES PERMISSION MATRIX
  if (pathname.startsWith('/admin')) {
    // अगर Reception लॉगिन है, तो उसे सिर्फ इन 3 रूट्स की इजाजत है:
    const receptionAllowedRoutes = [
      '/admin/patients',
      '/admin/appointments',
      '/admin/billing',
    ];

    const isAllowedForReception = receptionAllowedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (role === 'RECEPTION') {
      // अगर रिसेप्शनिस्ट Departments, Doctors, Reports, Roles, Dashboard में घुसने की कोशिश करे -> ब्लॉक
      if (!isAllowedForReception) {
        return NextResponse.redirect(new URL('/reception/dashboard', request.url));
      }
    } else if (role !== 'ADMIN') {
      // अगर Admin भी नहीं है और Reception भी नहीं (जैसे Doctor/Patient) -> सीधा उनके पोर्टल पर भेजें
      return getRoleRedirect(role, request.url);
    }
  }

  return NextResponse.next();
}

function getRoleRedirect(role: string | undefined, baseUrl: string) {
  if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', baseUrl));
  if (role === 'DOCTOR') return NextResponse.redirect(new URL('/doctor/dashboard', baseUrl));
  if (role === 'RECEPTION') return NextResponse.redirect(new URL('/reception/dashboard', baseUrl));
  if (role === 'PATIENT') return NextResponse.redirect(new URL('/patient/dashboard', baseUrl));
  return NextResponse.redirect(new URL('/login', baseUrl));
}

// यह मैचर आपके सभी 9 रूट्स और उनके इनर पेजों को सुरक्षित करता है
export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/reception/:path*',
    '/patient/:path*',
  ],
};