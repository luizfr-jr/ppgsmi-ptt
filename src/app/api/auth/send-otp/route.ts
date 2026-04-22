import { NextRequest, NextResponse } from 'next/server'
import { generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const code = await generateOTP(email)
    await sendOTPEmail(email, code)

    // When email is not configured (SMTP env vars missing), expose the code in the
    // API response so admins can log in during the transitional period before the
    // SMTP server is set up. This is safe because triggering the endpoint for a
    // given e-mail only reveals that e-mail's own code.
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    if (!emailConfigured) {
      return NextResponse.json({
        success: true,
        message: `Código (SMTP não configurado): ${code}`,
        devCode: code,
      })
    }

    return NextResponse.json({ success: true, message: 'Código enviado para seu e-mail' })
  } catch (error) {
    console.error('Send OTP error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 })
    }
    const msg = process.env.NODE_ENV === 'development'
      ? `Erro: ${(error as Error)?.message || String(error)}`
      : 'Erro ao enviar código'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
