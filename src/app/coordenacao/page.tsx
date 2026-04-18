import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CoordDashboard } from './CoordDashboard'

const ALLOWED = ['COORDENACAO', 'SUPERADMIN']

export default async function CoordenacaoPage() {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.user.role)) redirect('/')

  const templates = await prisma.template.findMany({
    include: {
      student: { select: { id: true, name: true, email: true } },
      advisor: { select: { id: true, name: true, email: true } },
      comments: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <CoordDashboard user={session.user} templates={templates as any} />
}
