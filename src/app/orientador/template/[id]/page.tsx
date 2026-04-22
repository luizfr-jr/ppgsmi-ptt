import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TemplateDetailOrientador } from './TemplateDetailOrientador'

type Props = { params: Promise<{ id: string }> }

export default async function TemplatePage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect('/')
  const role = session.user.role
  const allowed = role === 'ORIENTADOR' || role === 'COORDENACAO' || role === 'SUPERADMIN'
  if (!allowed) redirect('/')

  const { id } = await params
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      attachments: { orderBy: { createdAt: 'asc' } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  })

  // ORIENTADOR só vê templates em que é o advisor; COORDENACAO e SUPERADMIN veem qualquer um
  const canView = template && (
    role !== 'ORIENTADOR' || template.advisorId === session.user.id
  )
  if (!canView) notFound()

  return <TemplateDetailOrientador user={session.user} template={template as any} />
}
