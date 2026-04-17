import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StudentDashboard } from './StudentDashboard'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ALUNO') redirect('/')

  const templates = await prisma.template.findMany({
    where: { studentId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return <StudentDashboard user={session.user} templates={templates as any} />
}
