import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { OrientadorDashboard } from './OrientadorDashboard'

export default async function OrientadorPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ORIENTADOR') redirect('/')

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
