import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_ROLES = ['ALUNO', 'ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']
const CAN_MANAGE = ['COORDENACAO', 'SUPERADMIN']

type Props = { params: Promise<{ id: string }> }

/** PATCH /api/users/[id] — update user role or name (COORDENACAO+) */
export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await getSession()
  if (!session || !CAN_MANAGE.includes(session.user.role)) {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { role, name } = body

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Papel inválido' }, { status: 400 })
    }

    // Only SUPERADMIN can assign SUPERADMIN role
    if (role === 'SUPERADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Sem permissão para atribuir SUPERADMIN' }, { status: 403 })
    }

    // Can't change your own role
    if (id === session.user.id && role && role !== session.user.role) {
      return NextResponse.json({ success: false, error: 'Não é possível alterar seu próprio papel' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(name !== undefined && { name }),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

/** DELETE /api/users/[id] — remove user (SUPERADMIN only) */
export async function DELETE(req: NextRequest, { params }: Props) {
  const session = await getSession()
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ success: false, error: 'Não é possível excluir a si mesmo' }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}
