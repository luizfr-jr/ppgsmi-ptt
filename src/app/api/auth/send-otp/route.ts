import { NextRequest, NextResponse } from 'next/server'
import { generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

// Domínios autorizados para self-signup. UFN é o padrão; podem ser adicionados
// outros via env (ALLOWED_EMAIL_DOMAINS=ufn.edu.br,outro.com.br). Usuários
// já pré-cadastrados pela coordenação ignoram essa lista.
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'ufn.edu.br')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean)

function emailDomainAllowed(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at < 0) return false
  const domain = email.slice(at + 1).toLowerCase()
  return ALLOWED_DOMAINS.some(allowed => domain === allowed || domain.endsWith('.' + allowed))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)
    const normalizedEmail = email.toLowerCase().trim()

    // Two-tier access policy:
    //   1. Domain match (e.g. @ufn.edu.br) → self-signup is OK
    //   2. Email already exists in DB → admin pre-registered this user (e.g.
    //      external evaluator on a banca, super admin) → also OK
    // Anyone else is blocked with an instructive message.
    if (!emailDomainAllowed(normalizedEmail)) {
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })
      if (!existing) {
        return NextResponse.json({
          success: false,
          error: 'O acesso ao sistema é restrito a e-mails @ufn.edu.br. Caso seja avaliador externo ou colaborador, peça à coordenação do PPGSMI para fazer o pré-cadastro do seu e-mail.',
        }, { status: 403 })
      }
    }

    const code = await generateOTP(normalizedEmail)

    // On-screen codes are only allowed during local development without SMTP.
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    if (process.env.NODE_ENV === 'development' && !emailConfigured) {
      await sendOTPEmail(normalizedEmail, code)
      return NextResponse.json({ success: true, devCode: code, message: 'Código de desenvolvimento local' })
    }
    try {
      await sendOTPEmail(normalizedEmail, code)
    } catch (err) {
      const smtp = err as { code?: string; responseCode?: number }
      console.error('[send-otp] SMTP indisponível', { code: smtp.code, responseCode: smtp.responseCode })
      return NextResponse.json({ success: false, error: 'Não foi possível enviar o código por e-mail. Tente novamente em instantes ou entre em contato com a coordenação.' }, { status: 503 })
    }
    return NextResponse.json({ success: true, message: 'Código enviado para seu e-mail' })
  } catch (error) {
    console.error('Send OTP error:', { name: error instanceof Error ? error.name : 'UnknownError' })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: 'Não foi possível gerar o código de acesso. Tente novamente em instantes.',
    }, { status: 500 })
  }
}
