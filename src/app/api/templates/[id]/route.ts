import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

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

  // COORDENACAO cannot edit template content
  if (session.user.role === 'COORDENACAO') {
    return NextResponse.json({ success: false, error: 'Sem permissão para editar' }, { status: 403 })
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
      ...updateData
    } = body

    const updated = await prisma.template.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH template error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar template' }, { status: 500 })
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
