'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import {
  LayoutDashboard,
  MessageSquareWarning,
  Wrench,
  SprayCan,
  Megaphone,
  BarChart3,
  Wallet,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { ROLE_LABELS } from '@/lib/constants'

const NAV = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/complaints', label: '민원 관리', icon: MessageSquareWarning },
  { href: '/facilities', label: '시설 관리', icon: Wrench },
  { href: '/cleaning', label: '미화 관리', icon: SprayCan },
  { href: '/board', label: '소통', icon: Megaphone },
  { href: '/reports', label: '보고서', icon: BarChart3 },
  { href: '/budget', label: '예산 관리', icon: Wallet },
  { href: '/employees', label: '직원 관리', icon: Users },
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
        className="fixed top-4 right-4 z-50 md:hidden p-2 rounded-md"
        style={{ background: '#2b7a6f', color: '#fff' }}
      >
        <Menu size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          style={{ transition: `opacity var(--dur-ui) var(--ease-out)` }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-60 flex flex-col z-50 md:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: '#f5f1eb',
          borderLeft: '1px solid #e0d9cf',
          transition: `transform var(--dur-reveal) var(--ease-expo)`,
        }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e0d9cf' }}>
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="9" height="14" rx="1.5" fill="rgba(43,122,111,0.6)" stroke="rgba(43,122,111,0.9)" strokeWidth="0.5" />
              <rect x="13" y="3" width="9" height="19" rx="1.5" fill="rgba(43,122,111,0.8)" stroke="rgba(43,122,111,1)" strokeWidth="0.5" />
              <rect x="4.5" y="11" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.7)" />
              <rect x="7.2" y="11" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.4)" />
              <rect x="4.5" y="14.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.5)" />
              <rect x="7.2" y="14.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.8)" />
              <rect x="4.5" y="18" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.3)" />
              <rect x="7.2" y="18" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.6)" />
              <rect x="15.5" y="6" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.6)" />
              <rect x="18.2" y="6" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.3)" />
              <rect x="15.5" y="9.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.4)" />
              <rect x="18.2" y="9.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.7)" />
              <rect x="15.5" y="13" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.8)" />
              <rect x="18.2" y="13" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.5)" />
              <rect x="15.5" y="16.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.3)" />
              <rect x="18.2" y="16.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.6)" />
              <line x1="1" y1="22.5" x2="23" y2="22.5" stroke="rgba(43,122,111,0.2)" strokeWidth="0.5" />
            </svg>
            <span className="font-semibold text-[15px] tracking-tight" style={{ color: '#1a1a1a' }}>APT 관리</span>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden" style={{ color: '#999' }}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md"
                style={{
                  background: active ? '#2b7a6f' : 'transparent',
                  color: active ? '#fff' : '#3d3d3d',
                  transition: `all var(--dur-ui) var(--ease-out)`,
                  fontSize: '13px',
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(43,122,111,0.08)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {employee && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid #e0d9cf' }}>
            <div className="text-[13px] font-medium" style={{ color: '#1a1a1a' }}>{employee.name}</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#888', letterSpacing: '0.03em' }}>
              {ROLE_LABELS[employee.role]}
            </div>
            <button
              onClick={signOut}
              className="mt-2.5 flex items-center gap-1.5 text-[12px]"
              style={{
                color: '#999',
                transition: `color var(--dur-ui) var(--ease-out)`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#333' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#999' }}
            >
              <LogOut size={13} />
              로그아웃
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
