import { NextRequest, NextResponse } from 'next/server'
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
      ...updateData
    } = body

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
      // Fire-and-forget — don't block the response. Any error is logged inside.
      void recordStatusTransition({
        templateId: id,
        fromStatus,
        toStatus,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorRole: session.user.role,
      })
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
      },
    })
  } catch (err) {
    console.error('[workflow] failed to log TemplateEvent:', err)
  }

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
    if (params.toStatus === 'ENVIADO' && tpl.advisor?.email) {
      await sendTemplateSubmittedEmail({
        to: tpl.advisor.email,
        alunoName,
        templateTitle: title,
        templateId: params.templateId,
      })
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
