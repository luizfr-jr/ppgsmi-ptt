import { redirect } from 'next/navigation'
import { getSession, hasMinRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CoordDashboard } from './CoordDashboard'
import { UserRole } from '@/types'

export default async function CoordenacaoPage() {
  const session = await getSession()
  if (!session || !hasMinRole(session.user.role as UserRole, 'COORDENACAO')) redirect('/')

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
