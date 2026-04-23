'use client'

import { useState, ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt'
import { UserCog, UserPlus, Trash2, Pencil, Check, X, Search, Shield, GraduationCap, Users, Star, AlertCircle, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type UserRole = 'ALUNO' | 'ORIENTADOR' | 'COORDENACAO' | 'SUPERADMIN'

interface UserItem {
  id: string
  name: string | null
  email: string
  role: UserRole
  createdAt: Date
}

interface Props {
  currentUser: { id: string; email: string; name: string | null; role: string }
  initialUsers: UserItem[]
}

const roleConfig: Record<UserRole, { label: string; color: string; icon: ReactNode }> = {
  ALUNO: { label: 'Aluno', color: 'bg-blue-100 text-blue-700', icon: <GraduationCap size={13} /> },
  ORIENTADOR: { label: 'Orientador', color: 'bg-ninma-teal-light text-ninma-teal-dark', icon: <Users size={13} /> },
  COORDENACAO: { label: 'Coordenação', color: 'bg-ninma-purple-light text-ninma-purple', icon: <Shield size={13} /> },
  SUPERADMIN: { label: 'Super Admin', color: 'bg-orange-100 text-orange-700', icon: <Star size={13} /> },
}

const AVAILABLE_ROLES: UserRole[] = ['ALUNO', 'ORIENTADOR', 'COORDENACAO', 'SUPERADMIN']

export function UserManagement({ currentUser, initialUsers }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('ALUNO')
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('ALUNO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSuperAdmin = currentUser.role === 'SUPERADMIN'
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  // A user "needs review" when they self-signed up: created recently (<14 days),
  // still on the default ALUNO role, AND has no name set (admins always set a name).
  const needsReview = (u: UserItem) => {
    if (u.role !== 'ALUNO' || u.name) return false
    const ageDays = (Date.now() - new Date(u.createdAt).getTime()) / 86400000
    return ageDays <= 14
  }
  const pendingCount = users.filter(needsReview).length

  const filtered = users
    .filter(u => {
      const matchSearch = !search ||
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = !filterRole || u.role === filterRole
      const matchPending = !showPendingOnly || needsReview(u)
      return matchSearch && matchRole && matchPending
    })
    // Pending-review users bubble to the top
    .sort((a, b) => {
      const ap = needsReview(a) ? 1 : 0
      const bp = needsReview(b) ? 1 : 0
      if (ap !== bp) return bp - ap
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  function startEdit(u: UserItem) {
    setEditingId(u.id)
    setEditName(u.name || '')
    setEditRole(u.role)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setError('')
  }

  async function saveEdit(id: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, role: editRole }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, name: json.data.name, role: json.data.role } : u))
      setEditingId(null)
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Excluir o usuário ${email}? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir')
    } finally {
      setLoading(false)
    }
  }

  async function addUser() {
    if (!newEmail.trim()) { setError('E-mail obrigatório'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() || undefined, role: newRole }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setUsers(prev => [json.data, ...prev])
      setShowAdd(false)
      setNewEmail('')
      setNewName('')
      setNewRole('ALUNO')
    } catch (e: any) {
      setError(e.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const rolesToShow = isSuperAdmin ? AVAILABLE_ROLES : AVAILABLE_ROLES.filter(r => r !== 'SUPERADMIN')

  return (
    <div className="min-h-screen bg-ninma-gray-light flex flex-col">
      <Header user={currentUser} onMenuToggle={() => setMenuOpen(o => !o)} menuOpen={menuOpen} />
      <div className="flex flex-1">
        <Sidebar role={currentUser.role} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-ninma-dark flex items-center gap-2">
                  <UserCog size={24} className="text-ninma-teal" />
                  Gestão de Usuários
                </h1>
                <p className="text-gray-500 mt-1">Cadastre e gerencie os perfis de acesso ao sistema</p>
              </div>
              <button
                onClick={() => { setShowAdd(true); setError('') }}
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus size={16} />
                Novo Usuário
              </button>
            </div>

            {/* Pending-review alert */}
            {pendingCount > 0 && (
              <div
                onClick={() => setShowPendingOnly(v => !v)}
                className={`card mb-4 cursor-pointer border-2 transition-all ${
                  showPendingOnly ? 'border-ninma-pink bg-ninma-pink/5' : 'border-ninma-orange bg-ninma-orange-light/40 hover:bg-ninma-orange-light'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ninma-orange-dark shadow-sm">
                    <Bell size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-ninma-dark">
                      {pendingCount} {pendingCount === 1 ? 'novo cadastro aguarda' : 'novos cadastros aguardam'} revisão
                    </div>
                    <div className="text-xs text-gray-600">
                      Usuários que se cadastraram sozinhos — confira o perfil correto (Aluno, Orientador ou Coordenação).
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-ninma-orange-dark">
                    {showPendingOnly ? 'Mostrar todos' : 'Ver somente pendentes'}
                  </span>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {AVAILABLE_ROLES.map(role => {
                const cfg = roleConfig[role]
                const count = users.filter(u => u.role === role).length
                return (
                  <div key={role} className={`card border-0 ${cfg.color} flex items-center gap-3`}>
                    <span className="text-2xl font-bold">{count}</span>
                    <div>
                      <div className="text-xs font-semibold">{cfg.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add user form */}
            {showAdd && (
              <div className="card mb-6 border-2 border-ninma-teal">
                <h3 className="font-semibold text-ninma-dark mb-4 flex items-center gap-2">
                  <UserPlus size={16} className="text-ninma-teal" />
                  Cadastrar novo usuário
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">E-mail *</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="usuario@ufn.edu.br"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Papel *</label>
                    <select
                      className="input"
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as UserRole)}
                    >
                      {rolesToShow.map(r => (
                        <option key={r} value={r}>{roleConfig[r].label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Nome (opcional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Nome completo"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                <div className="flex gap-3 mt-4">
                  <button onClick={addUser} disabled={loading} className="btn-primary flex items-center gap-2">
                    <Check size={15} />
                    {loading ? 'Salvando...' : 'Cadastrar'}
                  </button>
                  <button onClick={() => { setShowAdd(false); setError('') }} className="btn-outline flex items-center gap-2">
                    <X size={15} />
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="card mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    placeholder="Buscar por nome ou e-mail..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="input sm:w-44"
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                >
                  <option value="">Todos os papéis</option>
                  {AVAILABLE_ROLES.map(r => (
                    <option key={r} value={r}>{roleConfig[r].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* User list */}
            {error && !showAdd && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {filtered.length === 0 ? (
              <div className="card text-center py-12">
                <UserCog size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(u => {
                  const cfg = roleConfig[u.role]
                  const isEditing = editingId === u.id
                  const isMe = u.id === currentUser.id
                  const canEdit = isSuperAdmin || (currentUser.role === 'COORDENACAO' && u.role !== 'SUPERADMIN')
                  const canDelete = isSuperAdmin && !isMe

                  const pending = needsReview(u)
                  return (
                    <div
                      key={u.id}
                      className={`card hover:shadow-md transition-shadow ${
                        pending ? 'border-l-4 border-l-ninma-orange bg-ninma-orange-light/20' : ''
                      }`}
                    >
                      {isEditing ? (
                        /* Edit mode */
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              className="input"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Nome"
                            />
                            <select
                              className="input"
                              value={editRole}
                              onChange={e => setEditRole(e.target.value as UserRole)}
                            >
                              {rolesToShow.map(r => (
                                <option key={r} value={r}>{roleConfig[r].label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => saveEdit(u.id)}
                              disabled={loading}
                              className="btn-primary py-2 px-3 flex items-center gap-1"
                            >
                              <Check size={14} />
                              {loading ? '...' : 'Salvar'}
                            </button>
                            <button onClick={cancelEdit} className="btn-outline py-2 px-3">
                              <X size={14} />
                            </button>
                          </div>
                          {error && <p className="text-red-500 text-xs w-full">{error}</p>}
                        </div>
                      ) : (
                        /* View mode */
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                                {cfg.icon}
                                {cfg.label}
                              </span>
                              {isMe && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Você</span>
                              )}
                              {pending && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest bg-ninma-orange text-white px-2 py-0.5 rounded uppercase">
                                  <AlertCircle size={10} />
                                  Novo · Revisar
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-ninma-dark truncate">
                              {u.name || <span className="text-gray-400 italic">Sem nome</span>}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-3 flex-wrap mt-0.5">
                              <span>{u.email}</span>
                              <span>Cadastro: {format(new Date(u.createdAt), "d MMM yyyy", { locale: ptBR })}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {canEdit && (
                              <button
                                onClick={() => startEdit(u)}
                                className="btn-outline py-2 px-3 flex items-center gap-1 text-xs"
                                title="Editar"
                              >
                                <Pencil size={14} />
                                <span className="hidden sm:inline">Editar</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => deleteUser(u.id, u.email)}
                                className="py-2 px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all text-xs flex items-center gap-1"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">Excluir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
