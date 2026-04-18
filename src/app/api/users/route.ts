import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_ROLES = ['ALUNO', 'ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']
const CAN_LIST_ALL = ['ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']
const CAN_MANAGE = ['COORDENACAO', 'SUPERADMIN']
// Roles that ALUNOs are allowed to search (for advisor selection)
const ADVISOR_ROLES = ['ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']

/** GET /api/users — list users
 *  - ORIENTADOR+ can list any role
 *  - ALUNO can only list ORIENTADOR or COORDENACAO (for advisor selection modal)
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  // ALUNOs can only fetch advisor-eligible users
  if (session.user.role === 'ALUNO') {
    if (!role || !ADVISOR_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }
    const users = await prisma.user.findMany({
      where: { role },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ success: true, data: users })
  }

  // ORIENTADOR+ can list all (with optional role filter)
  if (!CAN_LIST_ALL.includes(session.user.role)) {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

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

/** PATCH /api/users — update own profile (name, advisorId) */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, advisorId } = body

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(advisorId !== undefined && { advisorId: advisorId || null }),
      },
      select: { id: true, name: true, email: true, role: true, advisorId: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
  }
}
