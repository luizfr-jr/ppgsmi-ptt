import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP, getOrCreateUser, createSession } from '@/lib/auth'
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

    const user = await getOrCreateUser(email)
    await createSession(user.id, user.email, user.role as any, user.name)

    // Redirect based on role
    const redirectMap: Record<string, string> = {
      ALUNO: '/dashboard',
      ORIENTADOR: '/orientador',
      COORDENACAO: '/coordenacao',
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
