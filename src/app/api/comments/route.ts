import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  templateId: z.string(),
  content: z.string().min(1).max(2000),
  fieldRef: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  // Only COORDENACAO and ORIENTADOR can comment
  if (session.user.role === 'ALUNO') {
    return NextResponse.json({ success: false, error: 'Alunos não podem adicionar comentários' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { templateId, content, fieldRef } = schema.parse(body)

    // Check access
    const template = await prisma.template.findUnique({ where: { id: templateId } })
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
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

    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (error) {
    console.error('POST comment error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao adicionar comentário' }, { status: 500 })
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
