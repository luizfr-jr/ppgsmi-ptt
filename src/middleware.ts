import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'ppgsmi-session'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ppgsmi-ninmahub-secret-key-2025-change-in-production'
)

const publicPaths = ['/', '/login', '/api/auth/send-otp', '/api/auth/verify-otp']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    publicPaths.some(p => pathname === p) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/manifest')
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

    if (pathname.startsWith('/dashboard') && role !== 'ALUNO') {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url))
    }
    if (pathname.startsWith('/orientador') && role !== 'ORIENTADOR') {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url))
    }
    if (pathname.startsWith('/coordenacao') && role !== 'COORDENACAO') {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

function getRoleHome(role: string): string {
  switch (role) {
    case 'ORIENTADOR': return '/orientador'
    case 'COORDENACAO': return '/coordenacao'
    default: return '/dashboard'
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest|icons|sw.js|workbox).*)'],
}
