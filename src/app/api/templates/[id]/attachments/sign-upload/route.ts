import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { supabase, BUCKET } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

/**
 * POST /api/templates/[id]/attachments/sign-upload
 *
 * Issues a Supabase Storage signed upload URL so the client can PUT large
 * files (>4.5 MB) directly to storage, bypassing the Vercel function body
 * limit. The client must call /api/templates/[id]/attachments/finalize after
 * the upload completes to register the row in the database.
 *
 * Body: { filename: string, mimeType?: string }
 * Returns: { uploadUrl, token, path, filename }
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
    const originalName: string = (body.filename || 'arquivo').toString()
    const ext = originalName.split('.').pop() || 'bin'
    const filename = `${crypto.randomUUID()}.${ext}`
    const path = `${id}/${filename}`

    // Make sure bucket exists (idempotent)
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error || !data) {
      console.error('createSignedUploadUrl error:', error)
      return NextResponse.json({ success: false, error: 'Erro ao gerar URL de upload' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      token: data.token,
      path,
      filename,
    })
  } catch (err) {
    console.error('sign-upload error:', err)
    return NextResponse.json({ success: false, error: 'Erro ao gerar upload assinado' }, { status: 500 })
  }
}
