'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Edit, User, ChevronDown } from 'lucide-react'
import { Template } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  user: { id: string; email: string; name: string | null; role: string; advisorId?: string | null }
  templates: Template[]
}

interface Orientador {
  id: string
  name: string | null
  email: string
}

const statusConfig = {
  RASCUNHO: { label: 'Rascunho', icon: <Clock size={14} />, className: 'badge-rascunho' },
  ENVIADO: { label: 'Enviado', icon: <CheckCircle size={14} />, className: 'badge-enviado' },
  REVISAO: { label: 'Em Revisão', icon: <AlertCircle size={14} />, className: 'badge-revisao' },
  APROVADO: { label: 'Aprovado', icon: <CheckCircle size={14} />, className: 'badge-aprovado' },
}

function needsSetup(user: Props['user']): boolean {
  if (!user.name) return true
  const prefix = user.email.split('@')[0]
  // If name is the email prefix (auto-generated) or has no space, prompt setup
  return user.name === prefix || !user.name.trim().includes(' ')
}

export function StudentDashboard({ user, templates }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

  // Setup modal state
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'name' | 'advisor'>('name')
  const [nameInput, setNameInput] = useState('')
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('')
  const [orientadores, setOrientadores] = useState<Orientador[]>([])
  const [savingSetup, setSavingSetup] = useState(false)
  const [loadingAdvisors, setLoadingAdvisors] = useState(false)

  useEffect(() => {
    if (needsSetup(user)) {
      setShowModal(true)
    }
  }, [user])

  async function loadOrientadores() {
    setLoadingAdvisors(true)
    try {
      const res = await fetch('/api/users?role=ORIENTADOR')
      const data = await res.json()
      if (data.success) {
        // Also fetch COORDENACAO users who can also be advisors
        const res2 = await fetch('/api/users?role=COORDENACAO')
        const data2 = await res2.json()
        const all = [...(data.data || []), ...(data2.data || [])]
        setOrientadores(all)
      }
    } finally {
      setLoadingAdvisors(false)
    }
  }

  function handleNameNext(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) return
    setStep('advisor')
    loadOrientadores()
  }

  async function handleFinishSetup(e: React.FormEvent) {
    e.preventDefault()
    setSavingSetup(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          advisorId: selectedAdvisorId || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentUser(prev => ({
          ...prev,
          name: data.data.name,
          advisorId: data.data.advisorId,
        }))
        setShowModal(false)
      }
    } finally {
      setSavingSetup(false)
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

      {/* ── Setup Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${step === 'name' ? 'bg-ninma-teal scale-125' : 'bg-ninma-teal'}`} />
              <div className={`w-16 h-0.5 ${step === 'advisor' ? 'bg-ninma-teal' : 'bg-gray-200'} transition-all`} />
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${step === 'advisor' ? 'bg-ninma-teal scale-125' : 'bg-gray-200'}`} />
            </div>

            {step === 'name' ? (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ninma-teal-light flex items-center justify-center mb-4">
                    <User size={28} className="text-ninma-teal" />
                  </div>
                  <h2 className="text-xl font-bold text-ninma-dark">Bem-vindo ao NinMaHub!</h2>
                  <p className="text-gray-500 text-sm mt-2">
                    Informe seu nome completo para começar.
                  </p>
                </div>
                <form onSubmit={handleNameNext} className="space-y-4">
                  <div>
                    <label className="label">Nome completo *</label>
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
                    disabled={!nameInput.trim()}
                    className="btn-primary w-full"
                  >
                    Continuar →
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ninma-purple-light flex items-center justify-center mb-4">
                    <User size={28} className="text-ninma-purple" />
                  </div>
                  <h2 className="text-xl font-bold text-ninma-dark">Seu Orientador</h2>
                  <p className="text-gray-500 text-sm mt-2">
                    Selecione o professor que orienta seu trabalho.
                  </p>
                </div>
                <form onSubmit={handleFinishSetup} className="space-y-4">
                  <div className="relative">
                    <label className="label">Orientador *</label>
                    {loadingAdvisors ? (
                      <div className="input flex items-center gap-2 text-gray-400">
                        <span className="animate-spin">⏳</span> Carregando...
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          className="input appearance-none pr-10"
                          value={selectedAdvisorId}
                          onChange={e => setSelectedAdvisorId(e.target.value)}
                          required
                        >
                          <option value="">Selecione seu orientador...</option>
                          {orientadores.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.name || o.email}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('name')}
                      className="btn-outline flex-1"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={savingSetup || !selectedAdvisorId}
                      className="btn-primary flex-1"
                    >
                      {savingSetup ? 'Salvando...' : 'Começar!'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Header user={currentUser} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role="ALUNO" open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">

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

            {/* Templates */}
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
