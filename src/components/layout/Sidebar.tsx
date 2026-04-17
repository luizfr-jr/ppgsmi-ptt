'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Home, Users, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'

interface SidebarProps {
  role: string
  open?: boolean
  onClose?: () => void
}

const navItems: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  ALUNO: [
    { href: '/dashboard', label: 'Meu Template', icon: <Home size={18} /> },
    { href: '/dashboard/template/novo', label: 'Novo Template', icon: <FileText size={18} /> },
  ],
  ORIENTADOR: [
    { href: '/orientador', label: 'Templates dos Alunos', icon: <Users size={18} /> },
  ],
  COORDENACAO: [
    { href: '/coordenacao', label: 'Todos os Templates', icon: <Users size={18} /> },
  ],
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const items = navItems[role] || []

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        'fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === item.href
                  ? 'bg-ninma-teal text-white shadow-sm'
                  : 'text-gray-600 hover:bg-ninma-teal-light hover:text-ninma-teal-dark'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            PPGSMI – UFN<br />© {new Date().getFullYear()}
          </div>
        </div>
      </aside>
    </>
  )
}
