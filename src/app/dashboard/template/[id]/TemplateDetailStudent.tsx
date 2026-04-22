'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TemplateForm } from '@/components/template/TemplateForm'
import { TimelineView } from '@/components/template/TimelineView'
import { CommentPanel } from '@/components/template/CommentPanel'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { SetupModal, needsSetup } from '@/components/layout/SetupModal'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Template, Comment, Attachment } from '@/types'

interface Props {
  user: { id: string; email: string; name: string | null; role: string; advisorId?: string | null; advisor?: { name: string | null; email: string } | null }
  template: Template & { comments: Comment[]; attachments: Attachment[]; events?: import('@/types').TemplateEvent[] }
}

export function TemplateDetailStudent({ user, template: initialTemplate }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const [showSetup, setShowSetup] = useState(needsSetup(user))
  const [deleting, setDeleting] = useState(false)

  // Pre-fill aluno/orientador from user profile if fields are still empty
  // Priority: template.advisor (linked on template) → user.advisor (student's profile advisor)
  const templateAdvisor = (initialTemplate as any).advisor as { name: string | null; email: string } | null
  const profileAdvisor = currentUser.advisor
  const advisorName = templateAdvisor?.name || profileAdvisor?.name || profileAdvisor?.email || ''
  const prefilled = {
    ...initialTemplate,
    aluno: initialTemplate.aluno || currentUser.name || '',
    orientador: initialTemplate.orientador || advisorName,
  }

  const [template, setTemplate] = useState(prefilled)
  const [comments, setComments] = useState<Comment[]>(initialTemplate.comments || [])

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

      {showSetup && (
        <SetupModal
          user={currentUser}
          onComplete={(name, advisorId) => {
            setCurrentUser(prev => ({ ...prev, name, advisorId }))
            setShowSetup(false)
          }}
        />
      )}

      <Header user={currentUser} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
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

            {/* Workflow timeline */}
            <TimelineView
              currentStatus={template.status}
              events={initialTemplate.events}
              className="mb-6"
            />

            {/* Template form */}
            <TemplateForm
              template={template}
              attachments={initialTemplate.attachments}
              readOnly={!canEdit}
              canChangeStatus={canSubmit}
              userRole="ALUNO"
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
