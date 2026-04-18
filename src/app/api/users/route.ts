import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_ROLES = ['ALUNO', 'ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']
const CAN_LIST = ['ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']
const CAN_MANAGE = ['COORDENACAO', 'SUPERADMIN']

/** GET /api/users — list users (ORIENTADOR+) */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !CAN_LIST.includes(session.user.role)) {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, data: users })
}

/** POST /api/users — create/pre-register user (COORDENACAO+) */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !CAN_MANAGE.includes(session.user.role)) {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { email, name, role } = body

    if (!email) return NextResponse.json({ success: false, error: 'E-mail obrigatório' }, { status: 400 })
    if (!VALID_ROLES.includes(role)) return NextResponse.json({ success: false, error: 'Papel inválido' }, { status: 400 })

    // Only SUPERADMIN can create another SUPERADMIN
    if (role === 'SUPERADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Sem permissão para criar SUPERADMIN' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar usuário' }, { status: 500 })
  }
}

/** PATCH /api/users — update own profile name */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { name } = body

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
  }
}
