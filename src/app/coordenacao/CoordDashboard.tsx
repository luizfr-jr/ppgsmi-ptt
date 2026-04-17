'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { FileText, Search, Eye } from 'lucide-react'
import { Template } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  user: { id: string; email: string; name: string | null; role: string }
  templates: Template[]
}

const statusConfig = {
  RASCUNHO: { label: 'Rascunho', className: 'badge-rascunho' },
  ENVIADO: { label: 'Enviado', className: 'badge-enviado' },
  REVISAO: { label: 'Em Revisão', className: 'badge-revisao' },
  APROVADO: { label: 'Aprovado', className: 'badge-aprovado' },
}

export function CoordDashboard({ user, templates }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = templates.filter(t => {
    const matchSearch = !search ||
      (t.tituloPt || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.student?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.student?.email || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      <Header user={user} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role="COORDENACAO" open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-ninma-dark">Templates – Coordenação</h1>
              <p className="text-gray-500 mt-1">Visualize e comente todos os templates do PPGSMI</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

            {/* Filters */}
            <div className="card mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    placeholder="Buscar por título ou aluno..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="input sm:w-48"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="ENVIADO">Enviado</option>
                  <option value="REVISAO">Em Revisão</option>
                  <option value="APROVADO">Aprovado</option>
                </select>
              </div>
            </div>

            {/* Templates */}
            {filtered.length === 0 ? (
              <div className="card text-center py-12">
                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Nenhum template encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(template => {
                  const status = statusConfig[template.status as keyof typeof statusConfig] || statusConfig.RASCUNHO
                  return (
                    <div key={template.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={status.className}>{status.label}</span>
                            {(template.comments?.length || 0) > 0 && (
                              <span className="text-xs text-ninma-purple bg-ninma-purple-light px-2 py-0.5 rounded-full">
                                {template.comments?.length} comentário(s)
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-ninma-dark truncate">
                            {template.tituloPt || 'Sem título'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                            <span>Aluno: {template.student?.name || template.student?.email}</span>
                            {template.advisor && <span>Orientador: {template.advisor.name || template.advisor.email}</span>}
                            <span>Atualizado: {format(new Date(template.updatedAt), "d MMM", { locale: ptBR })}</span>
                          </div>
                        </div>
                        <Link
                          href={`/coordenacao/template/${template.id}`}
                          className="btn-outline flex items-center gap-2 py-2 px-4 flex-shrink-0"
                        >
                          <Eye size={15} />
                          <span className="hidden sm:inline">Ver</span>
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
