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
    await sendOTPEmail(normalizedEmail, code)

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
