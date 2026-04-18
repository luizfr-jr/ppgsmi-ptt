'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { FileText, Search, Edit2 } from 'lucide-react'
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

export function OrientadorDashboard({ user, templates }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = templates.filter(t =>
    !search ||
    (t.tituloPt || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.student?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      <Header user={user} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role={user.role} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-ninma-dark">Meus Orientandos</h1>
              <p className="text-gray-500 mt-1">Templates dos alunos sob sua orientação</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total', value: templates.length, color: 'bg-ninma-teal-light text-ninma-teal-dark' },
                { label: 'Pendentes', value: templates.filter(t => t.status === 'ENVIADO').length, color: 'bg-ninma-orange-light text-ninma-orange-dark' },
                { label: 'Aprovados', value: templates.filter(t => t.status === 'APROVADO').length, color: 'bg-green-100 text-green-700' },
              ].map(stat => (
                <div key={stat.label} className={`card ${stat.color} border-0`}>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="card mb-6">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Buscar orientando ou título..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Templates */}
            {filtered.length === 0 ? (
              <div className="card text-center py-12">
                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  {templates.length === 0
                    ? 'Nenhum aluno vinculado a você ainda.'
                    : 'Nenhum template encontrado.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(template => {
                  const status = statusConfig[template.status as keyof typeof statusConfig] || statusConfig.RASCUNHO
                  return (
                    <div key={template.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={status.className}>{status.label}</span>
                          </div>
                          <h3 className="font-semibold text-ninma-dark truncate">
                            {template.tituloPt || 'Sem título'}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            Aluno: {template.student?.name || template.student?.email} •
                            Atualizado: {format(new Date(template.updatedAt), "d 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                        <Link
                          href={`/orientador/template/${template.id}`}
                          className="btn-outline flex items-center gap-2 py-2 px-4 flex-shrink-0"
                        >
                          <Edit2 size={15} />
                          <span className="hidden sm:inline">Revisar</span>
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
