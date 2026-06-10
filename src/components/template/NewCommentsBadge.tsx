'use client'

import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { countNewComments } from '@/lib/commentSeen'

interface Props {
  templateId: string
  comments?: { id: string; authorId: string; createdAt: Date | string }[]
  currentUserId: string
}

/**
 * "N novos comentários" pill. Count is computed in useEffect because it reads
 * localStorage — computing during render would mismatch the server-rendered
 * HTML and trigger hydration warnings.
 */
export function NewCommentsBadge({ templateId, comments, currentUserId }: Props) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(countNewComments(templateId, comments, currentUserId))
  }, [templateId, comments, currentUserId])

  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 text-xs font-bold bg-ninma-purple text-white px-2 py-0.5 rounded-full">
      <MessageSquare size={11} />
      {count} {count === 1 ? 'novo comentário' : 'novos comentários'}
    </span>
  )
}
