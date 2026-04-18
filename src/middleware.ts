import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'ppgsmi-session'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ppgsmi-ninmahub-secret-key-2025-change-in-production'
)

const publicPaths = ['/', '/login', '/api/auth/send-otp', '/api/auth/verify-otp']

// Role hierarchy: which roles can access which areas
const CAN_ACCESS_COORDENACAO = ['COORDENACAO', 'SUPERADMIN']
const CAN_ACCESS_ORIENTADOR  = ['ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']
const CAN_ACCESS_DASHBOARD   = ['ALUNO']

function getRoleHome(role: string): string {
  switch (role) {
    case 'SUPERADMIN':  return '/coordenacao'
    case 'COORDENACAO': return '/coordenacao'
    case 'ORIENTADOR':  return '/orientador'
    default:            return '/dashboard'
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    publicPaths.some(p => pathname === p) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/debug')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as string

    if (pathname.startsWith('/dashboard') && !CAN_ACCESS_DASHBOARD.includes(role)) {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url))
    }
    if (pathname.startsWith('/orientador') && !CAN_ACCESS_ORIENTADOR.includes(role)) {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url))
    }
    if (pathname.startsWith('/coordenacao') && !CAN_ACCESS_COORDENACAO.includes(role)) {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest|icons|sw.js|workbox).*)'],
}
