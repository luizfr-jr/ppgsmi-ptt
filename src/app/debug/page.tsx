import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export default async function DebugPage() {
  const session = await getSession()
  const cookieStore = await cookies()
  const hasCookie = !!cookieStore.get('ppgsmi-session')

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, background: '#111', color: '#0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', marginBottom: 24 }}>🔍 Debug — Session Info</h1>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ color: '#ff0' }}>Cookie presente:</strong>{' '}
        {hasCookie ? '✅ SIM' : '❌ NÃO'}
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ color: '#ff0' }}>Session:</strong>{' '}
        {session ? '✅ Válida' : '❌ Nula / JWT inválido'}
      </div>

      {session && (
        <pre style={{ background: '#222', padding: 16, borderRadius: 8, color: '#0f0' }}>
          {JSON.stringify(session.user, null, 2)}
        </pre>
      )}

      <div style={{ marginTop: 32 }}>
        <a href="/" style={{ color: '#0af' }}>← Voltar ao login</a>
      </div>
    </div>
  )
}
