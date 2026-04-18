import { redirect } from 'next/navigation'
import { getSession, hasMinRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserManagement } from './UserManagement'
import { UserRole } from '@/types'

export default async function UsuariosPage() {
  const session = await getSession()
  if (!session || !hasMinRole(session.user.role as UserRole, 'COORDENACAO')) redirect('/')

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
