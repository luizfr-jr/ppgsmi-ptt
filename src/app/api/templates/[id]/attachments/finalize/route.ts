import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPublicUrl } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

/**
 * POST /api/templates/[id]/attachments/finalize
 *
 * Called by the client after a direct-to-storage upload via the signed URL,
 * to register the attachment row in the database.
 *
 * Body: { filename, originalName, mimeType, size, section? }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })

  if (session.user.role === 'ALUNO' && template.studentId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }
  if (session.user.role === 'COORDENACAO') {
    return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { filename, originalName, mimeType, size, section } = body

    if (!filename || !originalName || typeof size !== 'number') {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 })
    }

    const url = getPublicUrl(id, filename)

    const attachment = await prisma.attachment.create({
      data: {
        filename,
        originalName,
        mimeType: mimeType || 'application/octet-stream',
        size,
        url,
        templateId: id,
        ...(section ? { section } : {}),
      },
    })

    return NextResponse.json({ success: true, data: attachment })
  } catch (err) {
    console.error('finalize error:', err)
    return NextResponse.json({ success: false, error: 'Erro ao registrar anexo' }, { status: 500 })
  }
}
