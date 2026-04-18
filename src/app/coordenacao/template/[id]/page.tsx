import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TemplateDetailCoord } from './TemplateDetailCoord'

type Props = { params: Promise<{ id: string }> }

export default async function TemplatePage({ params }: Props) {
  const session = await getSession()
  if (!session || session.user.role !== 'COORDENACAO') redirect('/')

  const { id } = await params
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      advisor: { select: { id: true, name: true, email: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      attachments: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!template) notFound()

  return <TemplateDetailCoord user={session.user} template={template as any} />
}
