'use client'

import { useState, useEffect } from 'react'
import { User, ChevronDown } from 'lucide-react'

interface Props {
  user: { name: string | null; email: string; advisorId?: string | null }
  onComplete: (name: string, advisorId: string) => void
}

interface Orientador {
  id: string
  name: string | null
  email: string
}

export function needsSetup(user: { name: string | null; email: string; advisorId?: string | null }): boolean {
  if (!user.name || !user.name.trim().includes(' ')) return true
  if (!user.advisorId) return true
  return false
}

export function SetupModal({ user, onComplete }: Props) {
  const [step, setStep] = useState<'name' | 'advisor'>('name')
  const [nameInput, setNameInput] = useState(
    user.name && user.name.trim().includes(' ') ? user.name : ''
  )
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(user.advisorId || '')
  const [orientadores, setOrientadores] = useState<Orientador[]>([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(false)
  const [saving, setSaving] = useState(false)

  // Start on advisor step if name is already fine
  useEffect(() => {
    if (user.name && user.name.trim().includes(' ') && !user.advisorId) {
      setStep('advisor')
      loadOrientadores()
    }
  }, [])

  async function loadOrientadores() {
    setLoadingAdvisors(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/users?role=ORIENTADOR').then(r => r.json()),
        fetch('/api/users?role=COORDENACAO').then(r => r.json()),
      ])
      setOrientadores([...(r1.data || []), ...(r2.data || [])])
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

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAdvisorId) return
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim(), advisorId: selectedAdvisorId }),
      })
      const data = await res.json()
      if (data.success) {
        onComplete(data.data.name, data.data.advisorId)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === 'name' ? 'bg-ninma-teal scale-125' : 'bg-ninma-teal'}`} />
          <div className={`w-16 h-0.5 transition-all duration-300 ${step === 'advisor' ? 'bg-ninma-teal' : 'bg-gray-200'}`} />
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === 'advisor' ? 'bg-ninma-teal scale-125' : 'bg-gray-200'}`} />
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
              <button type="submit" disabled={!nameInput.trim()} className="btn-primary w-full">
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
            <form onSubmit={handleFinish} className="space-y-4">
              <div>
                <label className="label">Orientador *</label>
                {loadingAdvisors ? (
                  <div className="input text-gray-400 flex items-center gap-2">
                    <span className="animate-spin inline-block">⏳</span> Carregando...
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
                {(!user.name || !user.name.includes(' ')) && (
                  <button type="button" onClick={() => setStep('name')} className="btn-outline flex-1">
                    ← Voltar
                  </button>
                )}
                <button type="submit" disabled={saving || !selectedAdvisorId} className="btn-primary flex-1">
                  {saving ? 'Salvando...' : 'Começar! 🎉'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
