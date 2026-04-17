import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { user } = session

  try {
    let templates

    if (user.role === 'ALUNO') {
      templates = await prisma.template.findMany({
        where: { studentId: user.id },
        include: { advisor: { select: { id: true, name: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      })
    } else if (user.role === 'ORIENTADOR') {
      templates = await prisma.template.findMany({
        where: { advisorId: user.id },
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      })
    } else if (user.role === 'COORDENACAO') {
      templates = await prisma.template.findMany({
        include: {
          student: { select: { id: true, name: true, email: true } },
          advisor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      })
    }

    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error('GET templates error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  if (session.user.role !== 'ALUNO') {
    return NextResponse.json({ success: false, error: 'Apenas alunos podem criar templates' }, { status: 403 })
  }

  try {
    const template = await prisma.template.create({
      data: {
        studentId: session.user.id,
        status: 'RASCUNHO',
      },
    })

    return NextResponse.json({ success: true, data: template }, { status: 201 })
  } catch (error) {
    console.error('POST template error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar template' }, { status: 500 })
  }
}
