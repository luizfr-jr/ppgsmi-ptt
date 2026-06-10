import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendNewCommentEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  templateId: z.string(),
  content: z.string().min(1).max(2000),
  fieldRef: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { templateId, content, fieldRef } = schema.parse(body)

    // Check access — every role comments only on templates it participates in
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        advisor: { select: { id: true, name: true, email: true } },
      },
    })
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    if (session.user.role === 'ALUNO' && template.studentId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Sem acesso a este template' }, { status: 403 })
    }
    if (session.user.role === 'ORIENTADOR' && template.advisorId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Sem acesso a este template' }, { status: 403 })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        fieldRef: fieldRef || null,
        authorId: session.user.id,
        templateId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    // Notify the other participants by email (fire-and-forget — never blocks the response)
    void notifyParticipants({
      template,
      authorId: session.user.id,
      authorName: session.user.name || session.user.email,
      authorRole: session.user.role,
      content,
      fieldRef: fieldRef || null,
    })

    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (error) {
    console.error('POST comment error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao adicionar comentário' }, { status: 500 })
  }
}

/**
 * Sends the new-comment email to everyone involved in the template EXCEPT the
 * author: the aluno, the orientador, and — when the comment comes from the
 * coordenação or the template is already at the coordenação stage — the coord
 * team as well. Errors are logged, never thrown.
 */
async function notifyParticipants(params: {
  template: {
    id: string
    status: string
    tituloPt: string | null
    student: { id: string; name: string | null; email: string } | null
    advisor: { id: string; name: string | null; email: string } | null
  }
  authorId: string
  authorName: string
  authorRole: string
  content: string
  fieldRef: string | null
}) {
  try {
    const { template } = params
    const recipients: { email: string; role: string }[] = []

    if (template.student && template.student.id !== params.authorId) {
      recipients.push({ email: template.student.email, role: 'ALUNO' })
    }
    if (template.advisor && template.advisor.id !== params.authorId) {
      recipients.push({ email: template.advisor.email, role: 'ORIENTADOR' })
    }

    // Include the coordenação when the template is in (or past) their stage,
    // or when the comment author is coordenação replying into the thread.
    const coordInvolved =
      template.status === 'AGUARDANDO_COORDENACAO' ||
      template.status === 'APROVADO' ||
      params.authorRole === 'COORDENACAO' ||
      params.authorRole === 'SUPERADMIN'
    if (coordInvolved) {
      const coords = await prisma.user.findMany({
        where: { role: { in: ['COORDENACAO', 'SUPERADMIN'] }, id: { not: params.authorId } },
        select: { email: true },
      })
      for (const c of coords) {
        if (!recipients.some(r => r.email === c.email)) {
          recipients.push({ email: c.email, role: 'COORDENACAO' })
        }
      }
    }

    await sendNewCommentEmail({
      recipients,
      authorName: params.authorName,
      authorRole: params.authorRole,
      templateTitle: template.tituloPt || 'Template sem título',
      templateId: template.id,
      commentPreview: params.content,
      fieldRef: params.fieldRef,
    })
  } catch (err) {
    console.error('[comments] failed to notify participants:', err)
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const commentId = searchParams.get('id')
  if (!commentId) return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 })

  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment || comment.authorId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: commentId } })
  return NextResponse.json({ success: true })
}
