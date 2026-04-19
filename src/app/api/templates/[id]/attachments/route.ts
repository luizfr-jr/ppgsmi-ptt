import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { supabase, BUCKET, getPublicUrl } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const attachments = await prisma.attachment.findMany({
    where: { templateId: id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ success: true, data: attachments })
}

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
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const section = (formData.get('section') as string | null) || null

    if (!files.length) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Ensure bucket exists
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

    const created = []
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'bin'
      const filename = `${crypto.randomUUID()}.${ext}`
      const storagePath = `${id}/${filename}`

      const bytes = await file.arrayBuffer()
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, Buffer.from(bytes), {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (error) throw new Error(error.message)

      const url = getPublicUrl(id, filename)

      const attachment = await prisma.attachment.create({
        data: {
          filename,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          url,
          templateId: id,
          ...(section ? { section } : {}),
        },
      })
      created.push(attachment)
    }

    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao fazer upload' }, { status: 500 })
  }
}
