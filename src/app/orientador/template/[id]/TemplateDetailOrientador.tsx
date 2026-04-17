'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TemplateForm } from '@/components/template/TemplateForm'
import { CommentPanel } from '@/components/template/CommentPanel'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { ArrowLeft, User } from 'lucide-react'
import { Template, Comment } from '@/types'

interface Props {
  user: { id: string; email: string; name: string | null; role: string }
  template: Template & { comments: Comment[]; student: { id: string; name: string | null; email: string } }
}

export function TemplateDetailOrientador({ user, template: initialTemplate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [template, setTemplate] = useState(initialTemplate)
  const [comments, setComments] = useState<Comment[]>(initialTemplate.comments || [])

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      <Header user={user} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role="ORIENTADOR" open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Link href="/orientador" className="flex items-center gap-2 text-ninma-teal hover:underline text-sm">
                <ArrowLeft size={16} />
                Voltar
              </Link>
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
                <User size={14} className="text-ninma-purple" />
                <span className="text-sm text-ninma-dark">
                  {template.student?.name || template.student?.email}
                </span>
              </div>
            </div>

            <TemplateForm
              template={template}
              readOnly={false}
              canChangeStatus={true}
              onSaved={setTemplate as any}
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
