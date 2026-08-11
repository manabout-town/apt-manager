'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import {
  LayoutDashboard,
  MessageSquareWarning,
  LogOut,
  Building2,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { ROLE_LABELS } from '@/lib/constants'

const NAV = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/complaints', label: '민원 관리', icon: MessageSquareWarning },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { employee, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (pathname.startsWith('/login')) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-800 text-white p-2 rounded-lg"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-800 text-slate-200 flex flex-col z-50 transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={24} className="text-blue-400" />
            <span className="font-bold text-lg">APT 관리</span>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>

        {employee && (
          <div className="p-4 border-t border-slate-700">
            <div className="text-sm font-medium">{employee.name}</div>
            <div className="text-xs text-slate-400">
              {ROLE_LABELS[employee.role]}
            </div>
            <button
              onClick={signOut}
              className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
