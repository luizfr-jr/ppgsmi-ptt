import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

const publicPaths = ['/', '/login', '/api/auth/send-otp', '/api/auth/verify-otp']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(p => pathname === p) || pathname.startsWith('/_next') || pathname.startsWith('/icons') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const session = await getSession(request)

  if (!session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-based routing
  const role = session.user.role

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
