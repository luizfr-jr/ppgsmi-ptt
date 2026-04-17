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

    return NextResponse.json({ success: true, message: 'Código enviado para seu e-mail' })
  } catch (error) {
    console.error('Send OTP error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro ao enviar código' }, { status: 500 })
  }
}
