'use client'

import { useState } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { Comment } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CommentPanelProps {
  comments: Comment[]
  templateId: string
  currentUserId: string
  canComment: boolean
  onCommentAdded: (comment: Comment) => void
  onCommentDeleted: (id: string) => void
}

export function CommentPanel({
  comments,
  templateId,
  currentUserId,
  canComment,
  onCommentAdded,
  onCommentDeleted,
}: CommentPanelProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, content }),
      })
      const data = await res.json()
      if (data.success) {
        onCommentAdded(data.data)
        setContent('')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    if ((await res.json()).success) {
      onCommentDeleted(id)
    }
  }

  const roleLabels: Record<string, string> = {
    ORIENTADOR: 'Orientador',
    COORDENACAO: 'Coordenação',
    ALUNO: 'Aluno',
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-ninma-purple" />
        <h3 className="font-semibold text-ninma-dark">Comentários e Revisões</h3>
        {comments.length > 0 && (
          <span className="ml-auto bg-ninma-purple text-white text-xs px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="bg-ninma-purple-light rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-ninma-purple-dark">
                      {comment.author?.name || comment.author?.email}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({roleLabels[comment.author?.role || ''] || comment.author?.role})
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {format(new Date(comment.createdAt), "d MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-ninma-dark">{comment.content}</p>
                  {comment.fieldRef && (
                    <span className="text-xs text-ninma-purple mt-1 inline-block">
                      Ref: Campo {comment.fieldRef}
                    </span>
                  )}
                </div>
                {comment.authorId === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-ninma-pink p-1 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Adicionar comentário de revisão..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn-secondary px-4 py-2.5"
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  )
}
