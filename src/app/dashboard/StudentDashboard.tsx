'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Edit } from 'lucide-react'
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

export function StudentDashboard({ user, templates }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)

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

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      <Header user={user} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role="ALUNO" open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8 md:ml-0">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-ninma-dark">
                  Olá, {user.name?.split(' ')[0] || 'Aluno'}!
                </h1>
                <p className="text-gray-500 mt-1">
                  Gerencie seus templates de Produto Técnico-Tecnológico
                </p>
              </div>
              <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2">
                <Plus size={18} />
                <span className="hidden sm:inline">Novo Template</span>
              </button>
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
                <FileText size={48} className="mx-auto text-ninma-teal-light mb-4" />
                <h3 className="text-lg font-semibold text-ninma-dark">Nenhum template criado</h3>
                <p className="text-gray-500 mt-2 mb-6 text-sm">
                  Crie seu primeiro template de Produto Técnico-Tecnológico
                </p>
                <button onClick={handleCreate} disabled={creating} className="btn-primary">
                  <Plus size={18} className="inline mr-2" />
                  Criar template
                </button>
              </div>
            ) : (
              <div className="space-y-3">
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
