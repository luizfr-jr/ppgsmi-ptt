import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CoordDashboard } from './CoordDashboard'

const ALLOWED = ['COORDENACAO', 'SUPERADMIN']

export default async function CoordenacaoPage() {
  const session = await getSession()

  console.log('[coordenacao] session:', session?.user?.role ?? 'NULL')
  console.log('[coordenacao] allowed:', session ? ALLOWED.includes(session.user.role) : false)

  if (!session) {
    console.log('[coordenacao] NO SESSION → redirect /')
    redirect('/')
  }

  if (!ALLOWED.includes(session.user.role)) {
    console.log('[coordenacao] ROLE NOT ALLOWED:', session.user.role, '→ redirect /')
    redirect('/')
  }

  console.log('[coordenacao] PASSED GUARD — loading templates')

  let templates: any[] = []
  try {
    templates = await prisma.template.findMany({
      include: {
        student: { select: { id: true, name: true, email: true } },
        advisor: { select: { id: true, name: true, email: true } },
        comments: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
  } catch (e) {
    console.error('[coordenacao] PRISMA ERROR:', e)
  }

  return <CoordDashboard user={session.user} templates={templates} />
}
