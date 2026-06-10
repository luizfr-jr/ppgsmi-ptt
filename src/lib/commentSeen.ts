// Client-side "seen" tracking for template comments.
//
// We deliberately use localStorage instead of a DB table: it requires no
// migration, no extra queries on every dashboard load, and "unread" badges
// are a per-device convenience — the e-mail notification is the durable
// signal. If cross-device read-state ever becomes a requirement, swap this
// for a CommentRead table keyed by (userId, templateId).

const KEY_PREFIX = 'ppgsmi-comments-seen-'

export function markCommentsSeen(templateId: string) {
  try {
    localStorage.setItem(KEY_PREFIX + templateId, new Date().toISOString())
  } catch { /* storage unavailable (private mode) — badges just stay on */ }
}

function lastSeenAt(templateId: string): number {
  try {
    const v = localStorage.getItem(KEY_PREFIX + templateId)
    return v ? new Date(v).getTime() : 0
  } catch {
    return 0
  }
}

interface CommentLike {
  authorId: string
  createdAt: Date | string
}

/** Comments written by OTHERS after this device last opened the template. */
export function countNewComments(
  templateId: string,
  comments: CommentLike[] | undefined,
  currentUserId: string,
): number {
  if (!comments?.length) return 0
  const seen = lastSeenAt(templateId)
  return comments.filter(c =>
    c.authorId !== currentUserId &&
    new Date(c.createdAt).getTime() > seen
  ).length
}
