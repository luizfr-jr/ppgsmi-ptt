import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendTemplateReminderEmail } from '@/lib/email'

// Etapas que dependem de ação de um responsável (fora RASCUNHO/APROVADO/REVISAO).
// ENVIADO → aguarda o orientador; AGUARDANDO_COORDENACAO → aguarda a coordenação.
const PENDING_STATUSES = ['ENVIADO', 'AGUARDANDO_COORDENACAO'] as const

const DAY_MS = 24 * 60 * 60 * 1000
const STALE_DAYS = 7

/**
 * Verificador diário de templates parados. Para cada template em ENVIADO ou
 * AGUARDANDO_COORDENACAO parado há mais de 7 dias, envia um lembrete ao
 * responsável (orientador ou coordenação) — repetindo no máximo 1x por semana.
 *
 * Acionamento:
 *  - Vercel Cron (header Authorization: Bearer <CRON_SECRET>), diariamente.
 *  - Manual pelo SUPERADMIN (sessão logada) para testar.
 */
export async function GET(req: NextRequest) {
  // Autorização: token de cron OU superadmin logado
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`

  let isSuperAdmin = false
  if (!isCron) {
    const session = await getSession()
    isSuperAdmin = session?.user.role === 'SUPERADMIN'
  }
  if (!isCron && !isSuperAdmin) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  const now = Date.now()
  const staleBefore = new Date(now - STALE_DAYS * DAY_MS)

  // Candidatos: etapa pendente e sem lembrete na última semana
  const candidates = await prisma.template.findMany({
    where: {
      status: { in: PENDING_STATUSES as unknown as string[] },
      OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: staleBefore } }],
    },
    include: {
      student: { select: { name: true, email: true } },
      advisor: { select: { name: true, email: true } },
      events: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  // Coordenação (recebe lembrete de AGUARDANDO_COORDENACAO). Inclui a Profa.
  // Dirce, já cadastrada com papel COORDENACAO.
  const coordEmails = (
    await prisma.user.findMany({
      where: { role: { in: ['COORDENACAO', 'SUPERADMIN'] } },
      select: { email: true },
    })
  ).map(c => c.email).filter(Boolean)

  const sent: { templateId: string; to: string | string[]; role: string; days: number }[] = []
  const skipped: { templateId: string; reason: string }[] = []

  for (const t of candidates) {
    // Há quanto tempo está na etapa atual: usa o último evento cujo destino é o
    // status atual; se não houver (templates antigos), cai para updatedAt.
    const lastEvent = t.events[0]
    const enteredAt =
      lastEvent && lastEvent.toStatus === t.status ? lastEvent.createdAt : t.updatedAt
    if (new Date(enteredAt) >= staleBefore) {
      skipped.push({ templateId: t.id, reason: 'parado há menos de 7 dias' })
      continue
    }

    const daysWaiting = Math.floor((now - new Date(enteredAt).getTime()) / DAY_MS)
    const alunoName = t.student?.name || t.aluno || 'Aluno(a)'
    const title = t.tituloPt || 'Template sem título'

    if (t.status === 'ENVIADO') {
      const to = t.advisor?.email
      if (!to) {
        skipped.push({ templateId: t.id, reason: 'sem orientador vinculado' })
        continue
      }
      await sendTemplateReminderEmail({
        to, targetRole: 'ORIENTADOR', alunoName, templateTitle: title, templateId: t.id, daysWaiting,
      })
      sent.push({ templateId: t.id, to, role: 'ORIENTADOR', days: daysWaiting })
    } else {
      // AGUARDANDO_COORDENACAO
      if (coordEmails.length === 0) {
        skipped.push({ templateId: t.id, reason: 'nenhum e-mail de coordenação' })
        continue
      }
      await sendTemplateReminderEmail({
        to: coordEmails, targetRole: 'COORDENACAO', alunoName, templateTitle: title, templateId: t.id, daysWaiting,
      })
      sent.push({ templateId: t.id, to: coordEmails, role: 'COORDENACAO', days: daysWaiting })
    }

    await prisma.template
      .update({ where: { id: t.id }, data: { lastReminderAt: new Date(now) } })
      .catch(err => console.error('[cron/reminders] failed to set lastReminderAt:', err))
  }

  return NextResponse.json({
    success: true,
    checked: candidates.length,
    remindersSent: sent.length,
    sent,
    skipped,
  })
}
