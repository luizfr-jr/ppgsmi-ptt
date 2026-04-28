'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TemplateForm } from '@/components/template/TemplateForm'
import { TimelineView } from '@/components/template/TimelineView'
import { CommentPanel } from '@/components/template/CommentPanel'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { ArrowLeft, User, Users } from 'lucide-react'
import { Template, Comment, Attachment } from '@/types'

interface Props {
  user: { id: string; email: string; name: string | null; role: string }
  template: Template & {
    comments: Comment[]
    attachments: Attachment[]
    events?: import('@/types').TemplateEvent[]
    student: { id: string; name: string | null; email: string }
    advisor?: { id: string; name: string | null; email: string } | null
  }
}

export function TemplateDetailCoord({ user, template: initialTemplate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [template, setTemplate] = useState(initialTemplate)
  const [comments, setComments] = useState<Comment[]>(initialTemplate.comments || [])
  const [events, setEvents] = useState(initialTemplate.events || [])

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      <Header user={user} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role="COORDENACAO" open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <Link href="/coordenacao" className="flex items-center gap-2 text-ninma-teal hover:underline text-sm">
                <ArrowLeft size={16} />
                Voltar
              </Link>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
                  <User size={14} className="text-ninma-purple" />
                  <span className="text-sm text-ninma-dark">
                    Aluno: {template.student?.name || template.student?.email}
                  </span>
                </div>
                {template.advisor && (
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <Users size={14} className="text-ninma-teal" />
                    <span className="text-sm text-ninma-dark">
                      Orientador: {template.advisor.name || template.advisor.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <TimelineView
              currentStatus={template.status}
              events={events}
              className="mb-6"
            />

            {/* Read-only content, but coord can change status */}
            <TemplateForm
              template={template}
              attachments={initialTemplate.attachments}
              readOnly={true}
              canChangeStatus={true}
              userRole={user.role as 'COORDENACAO' | 'SUPERADMIN'}
              currentUser={user}
              onSaved={setTemplate as any}
              onStatusChanged={(t) => setEvents(prev => [...prev, {
                id: `local-${Date.now()}`,
                templateId: template.id,
                actorId: user.id,
                actorName: t.actorName,
                actorRole: t.actorRole,
                fromStatus: t.fromStatus,
                toStatus: t.toStatus,
                note: null,
                createdAt: t.createdAt,
              }])}
            />

            <div className="mt-6">
              <CommentPanel
                comments={comments}
                templateId={template.id}
                currentUserId={user.id}
                canComment={true}
                onCommentAdded={c => setComments(prev => [c, ...prev])}
                onCommentDeleted={id => setComments(prev => prev.filter(c => c.id !== id))}
              />
            </div>
          </div>
        </main>
      </div>
      <PWAInstallPrompt />
    </div>
  )
}
