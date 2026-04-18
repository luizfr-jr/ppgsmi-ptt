import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { prisma } from './db'
import { AuthSession, UserRole } from '@/types'

// Role hierarchy: higher number = more permissions
export const ROLE_LEVEL: Record<UserRole, number> = {
  ALUNO: 0,
  ORIENTADOR: 1,
  COORDENACAO: 2,
  SUPERADMIN: 3,
}

/** Returns true if userRole has at least the permissions of minRole */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0)
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)
const COOKIE_NAME = 'ppgsmi-session'
const OTP_EXPIRY_MINUTES = 10

export async function generateOTP(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  // Invalidate old codes
  await prisma.otpCode.updateMany({
    where: { email, used: false },
    data: { used: true },
  })

  await prisma.otpCode.create({
    data: { code, email, expiresAt },
  })

  return code
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  })

  if (!otpRecord) return false

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  })

  return true
}

export async function getOrCreateUser(email: string, role?: UserRole) {
  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role: role || 'ALUNO',
        name: null, // user will set their own name on first login
      },
    })
  }

  return user
}

export async function createSession(userId: string, email: string, role: UserRole, name: string | null) {
  const token = await new SignJWT({ userId, email, role, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })

  return token
}

export async function getSession(req?: NextRequest): Promise<AuthSession | null> {
  try {
    let token: string | undefined

    if (req) {
      token = req.cookies.get(COOKIE_NAME)?.value
    } else {
      const cookieStore = await cookies()
      token = cookieStore.get(COOKIE_NAME)?.value
    }

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      user: {
        id: payload.userId as string,
        email: payload.email as string,
        role: payload.role as UserRole,
        name: payload.name as string | null,
      },
    }
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
