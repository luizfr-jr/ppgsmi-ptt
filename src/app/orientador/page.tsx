import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { OrientadorDashboard } from './OrientadorDashboard'

const ALLOWED = ['ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']

export default async function OrientadorPage() {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.user.role)) redirect('/')

  // "Meus Orientandos" sempre mostra apenas os templates em que o usuário
  // logado é o orientador — inclusive para SUPERADMIN, que também pode ser
  // orientador. A visão completa do programa fica em "Todos os Templates"
  // (tela da coordenação).
  const templates = await prisma.template.findMany({
    where: { advisorId: session.user.id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      comments: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <OrientadorDashboard user={session.user} templates={templates as any} />
}
