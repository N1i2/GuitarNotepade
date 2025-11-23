import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 👇 Маршруты, которые требуют авторизации
const protectedRoutes = ['/home']

// 👇 Маршруты, которые доступны только для неавторизованных пользователей
const publicRoutes = ['/login', '/register', '/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 👇 Проверяем куки на наличие JWT токена
  const token = request.cookies.get('auth_token')?.value

  // 👇 Если пользователь пытается зайти на защищенный маршрут без токена
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 👇 Если пользователь авторизован и пытается зайти на публичные маршруты
  if (publicRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}