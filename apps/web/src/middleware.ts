import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static फाइल्स और लॉगिन को छोड़ दें
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/login' ||
    pathname === '/forgot-password'
  ) {
    return NextResponse.next();
  }

  // 2. Cookie चेक करें
  const token = request.cookies.get('token')?.value;

  // 3. अगर टोकन नहीं है, तो किसी भी प्रोटेक्टेड पेज को तुरंत ब्लॉक करें
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/reception/:path*',
    '/patient/:path*',
  ],
};