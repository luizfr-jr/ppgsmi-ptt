import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import {
  sendTemplateSubmittedEmail,
  sendTemplateApprovedByAdvisorEmail,
  sendTemplateFinalApprovedEmail,
  sendTemplateRevisionRequestedEmail,
} from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

async function checkAccess(templateId: string, userId: string, role: string) {
  const template = await prisma.template.findUnique({ where: { id: templateId } })
  if (!template) return null
  if (role === 'COORDENACAO' || role === 'SUPERADMIN') return template
  if (role === 'ALUNO' && template.studentId === userId) return template
  if (role === 'ORIENTADOR' && template.advisorId === userId) return template
  return null
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const template = await checkAccess(id, session.user.id, session.user.role)

  if (!template) {
    return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
  }

  const full = await prisma.template.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      advisor: { select: { id: true, name: true, email: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return NextResponse.json({ success: true, data: full })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const template = await checkAccess(id, session.user.id, session.user.role)

  if (!template) {
    return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
  }

  try {
    const body = await req.json()
    // Strip out relational/non-updatable fields before sending to Prisma
    const {
      id: _id,
      studentId: _sid,
      advisorId: _aid,
      createdAt: _ca,
      updatedAt: _ua,
      advisor: _advisor,
      student: _student,
      comments: _comments,
      attachments: _attachments,
      events: _events,
      silent: _silent,
      ...updateData
    } = body

    // Admin override: superadmin can move a template through any stage without
    // triggering notification emails (used to regularize legacy templates).
    const silent = _silent === true && session.user.role === 'SUPERADMIN'

    // COORDENACAO can only change status — strip everything else.
    if (session.user.role === 'COORDENACAO') {
      for (const k of Object.keys(updateData)) {
        if (k !== 'status') delete (updateData as Record<string, unknown>)[k]
      }
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: false, error: 'Coordenação só pode alterar o status' }, { status: 403 })
      }
    }

    const fromStatus = template.status
    const toStatus: string | undefined = typeof updateData.status === 'string' ? updateData.status : undefined
    const statusChanged = toStatus !== undefined && toStatus !== fromStatus

    const updated = await prisma.template.update({
      where: { id },
      data: updateData,
    })

    if (statusChanged && toStatus) {
      // Run AFTER the response is sent, but via after() so Vercel keeps the
      // serverless function alive until it completes. A plain fire-and-forget
      // (void ...) would be killed when the function freezes, silently dropping
      // the notification email.
      after(recordStatusTransition({
        templateId: id,
        fromStatus,
        toStatus,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorRole: session.user.role,
        silent,
      }))
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH template error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar template' }, { status: 500 })
  }
}

/**
 * Records a TemplateEvent row and dispatches the right notification email
 * for the new state. Never throws — email failures shouldn't break the request.
 */
async function recordStatusTransition(params: {
  templateId: string
  fromStatus: string
  toStatus: string
  actorId: string
  actorName: string
  actorRole: string
  silent?: boolean
}) {
  try {
    await prisma.templateEvent.create({
      data: {
        templateId: params.templateId,
        actorId:    params.actorId,
        actorName:  params.actorName,
        actorRole:  params.actorRole,
        fromStatus: params.fromStatus,
        toStatus:   params.toStatus,
        note:       params.silent ? 'Ajuste manual pelo Super Admin (sem notificação)' : null,
      },
    })
  } catch (err) {
    console.error('[workflow] failed to log TemplateEvent:', err)
  }

  // Admin override: log the timeline event but skip all notification emails.
  if (params.silent) return

  try {
    const tpl = await prisma.template.findUnique({
      where: { id: params.templateId },
      include: {
        student: { select: { name: true, email: true } },
        advisor: { select: { name: true, email: true } },
      },
    })
    if (!tpl) return

    const title = tpl.tituloPt || 'Template sem título'
    const alunoName = tpl.student?.name || tpl.aluno || 'Aluno(a)'

    // RASCUNHO → ENVIADO : notify orientador
    if (params.toStatus === 'ENVIADO') {
      let advisorEmail = tpl.advisor?.email || null

      // Self-heal: if the template has no linked advisor (advisorId null), fall
      // back to the student's profile advisor and persist the link. This covers
      // templates created before the student picked an advisor, or where only
      // the advisor *name* (free text) was filled in on the cover.
      if (!advisorEmail && tpl.studentId) {
        const student = await prisma.user.findUnique({
          where: { id: tpl.studentId },
          select: { advisorId: true, advisor: { select: { email: true } } },
        })
        if (student?.advisor?.email && student.advisorId) {
          advisorEmail = student.advisor.email
          await prisma.template.update({
            where: { id: params.templateId },
            data: { advisorId: student.advisorId },
          }).catch(err => console.error('[workflow] failed to backfill advisorId:', err))
        }
      }

      if (advisorEmail) {
        await sendTemplateSubmittedEmail({
          to: advisorEmail,
          alunoName,
          templateTitle: title,
          templateId: params.templateId,
        })
      } else {
        // No advisor could be resolved — never fail silently. Notify the
        // coordenação so a submission is never lost, and log for diagnosis.
        console.error('[workflow] template submitted with NO advisor linked', { templateId: params.templateId, aluno: alunoName })
        const coords = await prisma.user.findMany({
          where: { role: { in: ['COORDENACAO', 'SUPERADMIN'] } },
          select: { email: true },
        })
        await sendTemplateApprovedByAdvisorEmail({
          to: coords.map(c => c.email).filter(Boolean),
          alunoName,
          orientadorName: tpl.orientador || 'Orientador não vinculado',
          templateTitle: `${title} (ATENÇÃO: aluno sem orientador vinculado)`,
          templateId: params.templateId,
        }).catch(() => {})
      }
    }

    // ENVIADO → AGUARDANDO_COORDENACAO : notify all coordenadores
    if (params.toStatus === 'AGUARDANDO_COORDENACAO') {
      const coords = await prisma.user.findMany({
        where: { role: { in: ['COORDENACAO', 'SUPERADMIN'] } },
        select: { email: true },
      })
      await sendTemplateApprovedByAdvisorEmail({
        to: coords.map(c => c.email).filter(Boolean),
        alunoName,
        orientadorName: tpl.advisor?.name || tpl.orientador || 'Orientador(a)',
        templateTitle: title,
        templateId: params.templateId,
      })
    }

    // AGUARDANDO_COORDENACAO → APROVADO : notify aluno (final approval for printing)
    if (params.toStatus === 'APROVADO' && tpl.student?.email) {
      await sendTemplateFinalApprovedEmail({
        to: tpl.student.email,
        alunoName,
        templateTitle: title,
        templateId: params.templateId,
      })
    }

    // Any status → REVISAO : notify aluno
    if (params.toStatus === 'REVISAO' && tpl.student?.email) {
      await sendTemplateRevisionRequestedEmail({
        to: tpl.student.email,
        alunoName,
        templateTitle: title,
        templateId: params.templateId,
        requesterRole: params.actorRole,
      })
    }
  } catch (err) {
    console.error('[workflow] failed to send transition email:', err)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { id } = await params

  if (session.user.role !== 'ALUNO') {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  const template = await prisma.template.findUnique({ where: { id } })
  if (!template || template.studentId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
  }

  await prisma.comment.deleteMany({ where: { templateId: id } })
  await prisma.template.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
