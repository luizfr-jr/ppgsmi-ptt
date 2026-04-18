'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TemplateForm } from '@/components/template/TemplateForm'
import { CommentPanel } from '@/components/template/CommentPanel'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Template, Comment, Attachment } from '@/types'

interface Props {
  user: { id: string; email: string; name: string | null; role: string }
  template: Template & { comments: Comment[]; attachments: Attachment[] }
}

export function TemplateDetailStudent({ user, template: initialTemplate }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [template, setTemplate] = useState(initialTemplate)
  const [comments, setComments] = useState<Comment[]>(initialTemplate.comments || [])
  const [deleting, setDeleting] = useState(false)

  const canEdit = template.status === 'RASCUNHO' || template.status === 'REVISAO'
  const canSubmit = template.status === 'RASCUNHO'

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
      if ((await res.json()).success) {
        router.push('/dashboard')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      <Header user={user} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role="ALUNO" open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-ninma-teal hover:underline text-sm">
                <ArrowLeft size={16} />
                Voltar
              </Link>
              {template.status === 'RASCUNHO' && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-danger flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              )}
            </div>

            {/* Template form */}
            <TemplateForm
              template={template}
              attachments={initialTemplate.attachments}
              readOnly={!canEdit}
              canChangeStatus={canSubmit}
              onSaved={setTemplate as any}
            />

            {/* Comments (read-only for student) */}
            {comments.length > 0 && (
              <div className="mt-6">
                <CommentPanel
                  comments={comments}
                  templateId={template.id}
                  currentUserId={user.id}
                  canComment={false}
                  onCommentAdded={c => setComments(prev => [c, ...prev])}
                  onCommentDeleted={id => setComments(prev => prev.filter(c => c.id !== id))}
                />
              </div>
            )}
          </div>
        </main>
      </div>
      <PWAInstallPrompt />
    </div>
  )
}
