import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { supabase, BUCKET } from '@/lib/supabase'

type Params = { params: Promise<{ id: string; attachId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { id, attachId } = await params

  const attachment = await prisma.attachment.findUnique({ where: { id: attachId } })
  if (!attachment || attachment.templateId !== id) {
    return NextResponse.json({ success: false, error: 'Anexo não encontrado' }, { status: 404 })
  }

  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })

  if (session.user.role === 'ALUNO' && template.studentId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  try {
    await supabase.storage
      .from(BUCKET)
      .remove([`${id}/${attachment.filename}`])

    await prisma.attachment.delete({ where: { id: attachId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete attachment error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir anexo' }, { status: 500 })
  }
}
