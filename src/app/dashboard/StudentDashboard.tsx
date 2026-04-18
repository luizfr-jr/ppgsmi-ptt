'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Edit, User } from 'lucide-react'
import { Template } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  user: { id: string; email: string; name: string | null; role: string }
  templates: Template[]
}

const statusConfig = {
  RASCUNHO: { label: 'Rascunho', icon: <Clock size={14} />, className: 'badge-rascunho' },
  ENVIADO: { label: 'Enviado', icon: <CheckCircle size={14} />, className: 'badge-enviado' },
  REVISAO: { label: 'Em Revisão', icon: <AlertCircle size={14} />, className: 'badge-revisao' },
  APROVADO: { label: 'Aprovado', icon: <CheckCircle size={14} />, className: 'badge-aprovado' },
}

/** Returns true if name looks like an auto-generated email prefix (no spaces, no accents) */
function isPlaceholderName(name: string | null, email: string): boolean {
  if (!name) return true
  const prefix = email.split('@')[0]
  return name === prefix || !name.trim().includes(' ')
}

export function StudentDashboard({ user, templates }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

  // Name setup modal
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (isPlaceholderName(user.name, user.email)) {
      setShowNameModal(true)
    }
  }, [user.name, user.email])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentUser(prev => ({ ...prev, name: data.data.name }))
        setShowNameModal(false)
      }
    } finally {
      setSavingName(false)
    }
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/templates', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        router.push(`/dashboard/template/${data.data.id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  const firstName = currentUser.name?.split(' ')[0] || 'Aluno'

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      {/* Name setup modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-ninma-teal-light flex items-center justify-center mb-4">
                <User size={28} className="text-ninma-teal" />
              </div>
              <h2 className="text-xl font-bold text-ninma-dark">Bem-vindo ao NinMaHub!</h2>
              <p className="text-gray-500 text-sm mt-2">
                Para começar, informe seu nome completo.
              </p>
            </div>
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input
                  type="text"
                  className="input text-center text-base"
                  placeholder="Ex: Maria da Silva"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingName || !nameInput.trim()}
                className="btn-primary w-full"
              >
                {savingName ? 'Salvando...' : 'Confirmar'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Header user={currentUser} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role="ALUNO" open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">

            {/* Header — sem botão "Novo Template" no canto */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-ninma-dark">
                Olá, {firstName}! 👋
              </h1>
              <p className="text-gray-500 mt-1">
                Gerencie seus templates de Produto Técnico-Tecnológico
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total', value: templates.length, color: 'bg-ninma-teal-light text-ninma-teal-dark' },
                { label: 'Rascunhos', value: templates.filter(t => t.status === 'RASCUNHO').length, color: 'bg-gray-100 text-gray-600' },
                { label: 'Em Revisão', value: templates.filter(t => t.status === 'REVISAO').length, color: 'bg-ninma-orange-light text-ninma-orange-dark' },
                { label: 'Aprovados', value: templates.filter(t => t.status === 'APROVADO').length, color: 'bg-green-100 text-green-700' },
              ].map(stat => (
                <div key={stat.label} className={`card ${stat.color} border-0`}>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Templates list */}
            {templates.length === 0 ? (
              <div className="card text-center py-16">
                <div className="w-20 h-20 rounded-full bg-ninma-teal-light flex items-center justify-center mx-auto mb-5">
                  <FileText size={36} className="text-ninma-teal" />
                </div>
                <h3 className="text-lg font-bold text-ninma-dark">Nenhum template criado</h3>
                <p className="text-gray-500 mt-2 mb-8 text-sm max-w-xs mx-auto">
                  Crie seu Template do Produto Técnico-Tecnológico (PTT).
                </p>
                <button onClick={handleCreate} disabled={creating} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={18} />
                  {creating ? 'Criando...' : 'Criar template'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* "Novo Template" button only shown when templates already exist */}
                <div className="flex justify-end mb-2">
                  <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    <span className="hidden sm:inline">Novo Template</span>
                  </button>
                </div>

                {templates.map(template => {
                  const status = statusConfig[template.status as keyof typeof statusConfig] || statusConfig.RASCUNHO
                  return (
                    <div key={template.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`${status.className} flex items-center gap-1`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </div>
                          <h3 className="font-semibold text-ninma-dark truncate">
                            {template.tituloPt || 'Template sem título'}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            Atualizado: {format(new Date(template.updatedAt), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/template/${template.id}`}
                          className="btn-outline flex items-center gap-2 py-2 px-4 flex-shrink-0"
                        >
                          <Edit size={15} />
                          <span className="hidden sm:inline">Editar</span>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      <PWAInstallPrompt />
    </div>
  )
}
