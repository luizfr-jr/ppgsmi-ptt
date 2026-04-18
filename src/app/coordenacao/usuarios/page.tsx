import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserManagement } from './UserManagement'

const ALLOWED = ['COORDENACAO', 'SUPERADMIN']

export default async function UsuariosPage() {
  const session = await getSession()
  if (!session || !ALLOWED.includes(session.user.role)) redirect('/')

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <UserManagement
      currentUser={session.user}
      initialUsers={users as any}
    />
  )
}
