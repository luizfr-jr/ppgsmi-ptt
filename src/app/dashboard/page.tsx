import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StudentDashboard } from './StudentDashboard'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ALUNO') redirect('/')

  // Fetch full user record (includes advisorId)
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, advisorId: true },
  })

  const templates = await prisma.template.findMany({
    where: { studentId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <StudentDashboard
      user={userRecord as any}
      templates={templates as any}
    />
  )
}
