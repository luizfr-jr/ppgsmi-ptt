import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function NovoTemplatePage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ALUNO') redirect('/')
  redirect('/dashboard')
}
