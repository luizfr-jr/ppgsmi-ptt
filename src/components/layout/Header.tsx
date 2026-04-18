'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, User, Menu, X } from 'lucide-react'
import { NinMaLogo } from './NinMaLogo'

interface HeaderProps {
  user: { name: string | null; email: string; role: string }
  onMenuToggle?: () => void
  menuOpen?: boolean
}

const roleLabels: Record<string, string> = {
  ALUNO: 'Aluno',
  ORIENTADOR: 'Orientador',
  COORDENACAO: 'Coordenação',
}

export function Header({ user, onMenuToggle, menuOpen }: HeaderProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <NinMaLogo className="h-8 w-auto" />
        <div className="hidden sm:block">
          <div className="text-sm font-semibold text-ninma-dark">PPGSMI</div>
          <div className="text-xs text-gray-400">Sistema de Templates</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-ninma-gray-light rounded-xl px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-ninma-teal flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-medium text-ninma-dark">{user.name || user.email}</div>
            <div className="text-xs text-gray-400">{roleLabels[user.role] || user.role}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-ninma-pink transition-colors px-3 py-2 rounded-xl hover:bg-ninma-pink-light"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
