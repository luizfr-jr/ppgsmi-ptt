import nodemailer from 'nodemailer'

const isDev = process.env.NODE_ENV === 'development'
const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)

const transporter = nodemailer.createTransport(
  emailConfigured
    ? ({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      } as nodemailer.TransportOptions)
    : ({ jsonTransport: true } as nodemailer.TransportOptions)
)

function logCodeToTerminal(email: string, code: string) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PPGSMI – Codigo de acesso (DEV)')
  console.log(`  Para: ${email}`)
  console.log(`  Codigo: \x1b[32m\x1b[1m${code}\x1b[0m`)
  console.log('  (Configure EMAIL_USER e EMAIL_PASS no .env para envio real)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

export async function sendOTPEmail(email: string, code: string) {
  // Always log the code to Vercel function logs as a backup (safe fallback)
  logCodeToTerminal(email, code)

  if (!emailConfigured) {
    return
  }
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #5fc3ad 0%, #756fb3 100%); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; text-align: center; }
        .code-box { background: #f0f9f7; border: 2px solid #5fc3ad; border-radius: 12px; padding: 20px 40px; display: inline-block; margin: 24px 0; }
        .code { font-size: 40px; font-weight: 800; color: #5fc3ad; letter-spacing: 8px; font-family: monospace; }
        .expiry { color: #6b7280; font-size: 13px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
        .university { color: #756fb3; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NinMaHub</h1>
          <p>PPGSMI – Sistema de Templates</p>
        </div>
        <div class="body">
          <p style="color:#374151; font-size:16px;">Seu código de acesso é:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p class="expiry">⏱ Este código expira em <strong>10 minutos</strong></p>
          <p style="color:#6b7280; font-size:13px; margin-top:24px;">
            Se você não solicitou este código, ignore este e-mail.
          </p>
        </div>
        <div class="footer">
          <span class="university">Universidade Franciscana</span><br>
          Programa de Pós-Graduação em Saúde Materno Infantil
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"PPGSMI – NinMaHub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `${code} – Seu código de acesso PPGSMI`,
      html,
    })
  } catch (smtpError) {
    console.error('SMTP falhou (código disponível nos logs acima):', smtpError)
    if (isDev) {
      // already logged above, just swallow
      return
    }
    throw smtpError
  }
}

// ─── Workflow notification emails ──────────────────────────────────────────
// These wrap a generic send so every transition uses the same visual shell.

function baseUrl() {
  return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://ppgsmi-ptt.vercel.app'
}

function renderShell({ title, intro, cta, ctaLabel, footer }: {
  title: string; intro: string; cta?: string; ctaLabel?: string; footer?: string
}) {
  const button = cta ? `
    <p style="text-align:center;margin:28px 0;">
      <a href="${cta}" style="display:inline-block;background:#6B5EA0;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:600;font-size:14px;">
        ${ctaLabel || 'Abrir documento'}
      </a>
    </p>` : ''
  return `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"></head>
    <body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#5fc3ad 0%,#756fb3 100%);padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">NinMaHub · PPGSMI</h1>
          <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">${title}</p>
        </div>
        <div style="padding:32px;color:#374151;font-size:15px;line-height:1.55;">
          ${intro}
          ${button}
          <p style="color:#6b7280;font-size:13px;margin-top:24px;">${footer || 'Esta é uma notificação automática do sistema de templates do PPGSMI.'}</p>
        </div>
        <div style="background:#f8fafc;padding:18px;text-align:center;color:#9ca3af;font-size:12px;">
          <span style="color:#756fb3;font-weight:600;">Universidade Franciscana</span><br>
          Programa de Pós-Graduação em Saúde Materno Infantil
        </div>
      </div>
    </body></html>`
}

async function sendMail(opts: { to: string | string[]; subject: string; html: string }) {
  if (!emailConfigured) {
    console.log(`[email fallback] would send to ${Array.isArray(opts.to) ? opts.to.join(', ') : opts.to} — subject: ${opts.subject}`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"PPGSMI – NinMaHub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
      subject: opts.subject,
      html: opts.html,
    })
  } catch (err) {
    // Workflow emails never block the request — log and continue.
    console.error(`[email] failed to send "${opts.subject}":`, err)
  }
}

/** Aluno submitted → notify orientador */
export async function sendTemplateSubmittedEmail(params: {
  to: string; alunoName: string; templateTitle: string; templateId: string
}) {
  const url = `${baseUrl()}/orientador/template/${params.templateId}`
  await sendMail({
    to: params.to,
    subject: `Novo template enviado para revisão — ${params.alunoName}`,
    html: renderShell({
      title: 'Template aguardando sua revisão',
      intro: `<p>Olá,</p><p><strong>${params.alunoName}</strong> enviou o template <em>"${params.templateTitle}"</em> para sua revisão como orientador.</p><p>Acesse o sistema para revisar e aprovar ou solicitar ajustes.</p>`,
      cta: url, ctaLabel: 'Revisar template',
    }),
  })
}

/** Orientador approved → notify coordenação (all users with role COORDENACAO) */
export async function sendTemplateApprovedByAdvisorEmail(params: {
  to: string[]; alunoName: string; orientadorName: string; templateTitle: string; templateId: string
}) {
  if (params.to.length === 0) return
  const url = `${baseUrl()}/coordenacao/template/${params.templateId}`
  await sendMail({
    to: params.to,
    subject: `Template aprovado pelo orientador — aguardando coordenação`,
    html: renderShell({
      title: 'Template aguardando aprovação final',
      intro: `<p>Olá,</p><p>O orientador <strong>${params.orientadorName}</strong> aprovou o template <em>"${params.templateTitle}"</em> do aluno <strong>${params.alunoName}</strong>.</p><p>O documento está pronto para a avaliação da coordenação.</p>`,
      cta: url, ctaLabel: 'Avaliar na coordenação',
    }),
  })
}

/** Coordenação approved final → notify aluno */
export async function sendTemplateFinalApprovedEmail(params: {
  to: string; alunoName: string; templateTitle: string; templateId: string
}) {
  const url = `${baseUrl()}/dashboard/template/${params.templateId}`
  await sendMail({
    to: params.to,
    subject: `Seu template foi aprovado para impressão`,
    html: renderShell({
      title: 'Template aprovado para impressão',
      intro: `<p>Olá, ${params.alunoName},</p><p>Seu template <em>"${params.templateTitle}"</em> foi aprovado pela coordenação do PPGSMI e está liberado para impressão.</p><p>Você já pode exportar o PDF final pelo sistema.</p>`,
      cta: url, ctaLabel: 'Abrir meu template',
    }),
  })
}

/** Orientador requested revision → notify aluno */
export async function sendTemplateRevisionRequestedEmail(params: {
  to: string; alunoName: string; templateTitle: string; templateId: string; requesterRole: string
}) {
  const url = `${baseUrl()}/dashboard/template/${params.templateId}`
  const who = params.requesterRole === 'COORDENACAO' || params.requesterRole === 'SUPERADMIN'
    ? 'a coordenação'
    : 'seu orientador'
  await sendMail({
    to: params.to,
    subject: `Revisão solicitada no seu template`,
    html: renderShell({
      title: 'Ajustes solicitados',
      intro: `<p>Olá, ${params.alunoName},</p><p>${who.charAt(0).toUpperCase() + who.slice(1)} revisou o template <em>"${params.templateTitle}"</em> e solicitou ajustes antes de prosseguir.</p><p>Abra o sistema para ver os comentários e fazer as correções.</p>`,
      cta: url, ctaLabel: 'Ver comentários',
    }),
  })
}

// ─── Account lifecycle emails ──────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ALUNO:       'Aluno',
  ORIENTADOR:  'Orientador',
  COORDENACAO: 'Coordenação',
  SUPERADMIN:  'Super Admin',
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ALUNO:       'Você poderá criar e preencher seus templates de Produto Técnico-Tecnológico, enviando-os ao seu orientador quando estiverem prontos.',
  ORIENTADOR:  'Você poderá revisar e aprovar os templates dos seus orientandos antes de encaminhá-los à coordenação.',
  COORDENACAO: 'Você poderá avaliar os templates aprovados pelos orientadores e liberá-los para impressão.',
  SUPERADMIN:  'Você tem acesso completo ao sistema, incluindo gestão de usuários e supervisão de todos os templates.',
}

/** Boas-vindas ao novo usuário (criado por admin ou self-signup) */
export async function sendWelcomeEmail(params: {
  to: string
  userName: string | null
  role: string
  advisorName?: string | null
  createdByAdmin?: boolean
}) {
  const url = baseUrl()
  const roleLabel = ROLE_LABELS[params.role] || params.role
  const roleDesc = ROLE_DESCRIPTIONS[params.role] || ''
  const greeting = params.userName ? `Olá, ${params.userName},` : 'Olá,'

  const advisorLine = params.role === 'ALUNO' && params.advisorName
    ? `<p><strong>Orientador vinculado:</strong> ${params.advisorName}</p>`
    : ''

  const origin = params.createdByAdmin
    ? '<p>Sua conta foi criada pela coordenação do PPGSMI.</p>'
    : '<p>Obrigado por se cadastrar no sistema.</p>'

  await sendMail({
    to: params.to,
    subject: `Bem-vindo(a) ao NinMaHub — PPGSMI`,
    html: renderShell({
      title: 'Sua conta foi criada',
      intro: `
        <p>${greeting}</p>
        ${origin}
        <p>Você já pode acessar a plataforma <strong>NinMaHub</strong>, o sistema de templates do Programa de Pós-Graduação em Saúde Materno Infantil da Universidade Franciscana.</p>
        <div style="background:#f0f9f7;border-left:3px solid #5fc3ad;padding:14px 18px;border-radius:6px;margin:18px 0;">
          <div style="font-size:11px;letter-spacing:1.5px;color:#756fb3;font-weight:700;margin-bottom:4px;">SEU PERFIL</div>
          <div style="font-size:16px;font-weight:700;color:#1a1f3a;">${roleLabel}</div>
          <div style="font-size:13px;color:#374151;margin-top:6px;">${roleDesc}</div>
        </div>
        ${advisorLine}
        <p>Para entrar, basta informar seu e-mail (<strong>${params.to}</strong>) e o sistema enviará um código de acesso.</p>
      `,
      cta: url, ctaLabel: 'Acessar o sistema',
      footer: 'Caso você não esperava receber este e-mail, pode ignorá-lo com segurança.',
    }),
  })
}

/** Novo self-signup → notifica superadmins para revisar o perfil */
export async function sendNewSignupNotification(params: {
  to: string[]
  newUserName: string | null
  newUserEmail: string
}) {
  if (params.to.length === 0) return
  const url = `${baseUrl()}/coordenacao/usuarios`
  const displayName = params.newUserName || params.newUserEmail
  await sendMail({
    to: params.to,
    subject: `Novo cadastro no sistema: ${displayName}`,
    html: renderShell({
      title: 'Novo usuário cadastrado',
      intro: `
        <p>Um novo usuário se cadastrou no sistema PPGSMI:</p>
        <div style="background:#fbe8ee;border-left:3px solid #D43E5C;padding:14px 18px;border-radius:6px;margin:18px 0;">
          <div style="font-size:15px;font-weight:700;color:#1a1f3a;">${displayName}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:2px;">${params.newUserEmail}</div>
          <div style="font-size:12px;color:#D43E5C;margin-top:10px;font-weight:600;">
            ⚠ Perfil padrão: ALUNO — revise se precisar ajustar para Orientador ou Coordenação.
          </div>
        </div>
        <p>Acesse a Gestão de Usuários para revisar e, se necessário, alterar o perfil, vincular a um orientador ou remover.</p>
      `,
      cta: url, ctaLabel: 'Abrir Gestão de Usuários',
    }),
  })
}
