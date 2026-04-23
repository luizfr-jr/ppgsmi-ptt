import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP, getOrCreateUser, createSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendWelcomeEmail, sendNewSignupNotification } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, code } = schema.parse(body)

    const valid = await verifyOTP(email, code)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Código inválido ou expirado' },
        { status: 401 }
      )
    }

    // Detect first-login (self-signup) so we can fire welcome + admin-notify emails.
    const existedBefore = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    const user = await getOrCreateUser(email)
    await createSession(user.id, user.email, user.role as any, user.name)

    if (!existedBefore) {
      // Welcome e-mail to the new user (fire-and-forget, never blocks login)
      void sendWelcomeEmail({
        to: user.email,
        userName: user.name,
        role: user.role,
        createdByAdmin: false,
      })
      // Notify all super-admins + coordenação that a new account appeared
      void (async () => {
        try {
          const admins = await prisma.user.findMany({
            where: { role: { in: ['SUPERADMIN', 'COORDENACAO'] } },
            select: { email: true },
          })
          await sendNewSignupNotification({
            to: admins.map(a => a.email).filter(Boolean),
            newUserName: user.name,
            newUserEmail: user.email,
          })
        } catch (err) {
          console.error('[signup] failed to notify admins:', err)
        }
      })()
    }

    // Redirect based on role
    const redirectMap: Record<string, string> = {
      ALUNO: '/dashboard',
      ORIENTADOR: '/orientador',
      COORDENACAO: '/coordenacao',
      SUPERADMIN: '/coordenacao',
    }

    return NextResponse.json({
      success: true,
      redirect: redirectMap[user.role] || '/dashboard',
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ success: false, error: 'Erro na verificação' }, { status: 500 })
  }
}
