import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { OrientadorDashboard } from './OrientadorDashboard'

const ALLOWED = ['ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']

export default async function OrientadorPage() {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.user.role)) redirect('/')

  // SUPERADMIN sees all templates; others see only their own advisees
  const isSuperAdmin = session.user.role === 'SUPERADMIN'
  const templates = await prisma.template.findMany({
    where: isSuperAdmin ? undefined : { advisorId: session.user.id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      comments: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <OrientadorDashboard user={session.user} templates={templates as any} />
}
