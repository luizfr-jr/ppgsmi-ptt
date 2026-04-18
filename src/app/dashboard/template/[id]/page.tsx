import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TemplateDetailStudent } from './TemplateDetailStudent'

type Props = { params: Promise<{ id: string }> }

export default async function TemplatePage({ params }: Props) {
  const session = await getSession()
  if (!session || session.user.role !== 'ALUNO') redirect('/')

  const { id } = await params
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      advisor: { select: { id: true, name: true, email: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      attachments: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!template || template.studentId !== session.user.id) notFound()

  // Fetch full user record (includes advisor name for auto-fill)
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, role: true, advisorId: true,
      advisor: { select: { name: true, email: true } },
    },
  })

  return <TemplateDetailStudent user={userRecord as any} template={template as any} />
}
