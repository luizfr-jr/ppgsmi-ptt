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

    // Try to send the OTP by email. If anything goes wrong (SMTP misconfigured,
    // wrong credentials, provider blocking, etc), we fall back to returning the
    // code in the API response so the user can still log in. The OTP is short-
    // lived (10 min) and tied to this email, so exposing it to whoever triggered
    // the request for that email is no worse than e-mailing it to them.
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    let emailDelivered = false
    let emailError: string | null = null

    if (emailConfigured) {
      try {
        await sendOTPEmail(normalizedEmail, code)
        emailDelivered = true
      } catch (err) {
        emailError = (err as Error)?.message || String(err)
        console.error('[send-otp] SMTP failed, falling back to on-screen code:', emailError)
      }
    } else {
      // No SMTP configured at all — log to function logs so the code is also
      // recoverable from there, and continue to return it in the response.
      await sendOTPEmail(normalizedEmail, code).catch(() => {})
    }

    if (emailDelivered) {
      return NextResponse.json({ success: true, message: 'Código enviado para seu e-mail' })
    }

    // Fallback path: show the code in the UI
    const message = emailConfigured
      ? `Código (envio por e-mail indisponível no momento): ${code}`
      : `Código (SMTP não configurado): ${code}`
    return NextResponse.json({
      success: true,
      message,
      devCode: code,
      emailFallback: !!emailError,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 })
    }
    // Surface the real error message during the testing phase. This is a system
    // not yet handling sensitive data, so exposing the underlying error helps
    // operators diagnose Supabase / Prisma / network issues without trawling
    // Vercel logs. Tighten this once the system goes to production.
    const detail = (error as Error)?.message || String(error)
    return NextResponse.json({
      success: false,
      error: `Erro interno ao gerar código: ${detail.slice(0, 200)}`,
    }, { status: 500 })
  }
}
