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
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md"
        style={{ background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
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
        className={`fixed top-0 left-0 h-full w-60 flex flex-col z-50 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--bg-sidebar)',
          transition: `transform var(--dur-reveal) var(--ease-expo)`,
        }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
              <line x1="1" y1="22.5" x2="23" y2="22.5" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            </svg>
            <span className="font-semibold text-[15px] text-white tracking-tight">APT 관리</span>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-white/50 hover:text-white">
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
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  transition: `all var(--dur-ui) var(--ease-out)`,
                  fontSize: '13px',
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
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

        <div className="px-3 pb-1">
          <svg viewBox="0 0 210 65" className="w-full" fill="none">
            <rect x="5" y="30" width="28" height="33" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <rect x="10" y="35" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.35)" />
            <rect x="23" y="35" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.55)" />
            <rect x="10" y="42" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.25)" />
            <rect x="23" y="42" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.45)" />
            <rect x="10" y="49" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.5)" />
            <rect x="23" y="49" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.2)" />
            <rect x="38" y="8" width="38" height="55" rx="1.5" fill="rgba(255,255,255,0.08)" />
            <rect x="45" y="14" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.5)" />
            <rect x="64" y="14" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.3)" />
            <rect x="45" y="22" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.7)" />
            <rect x="64" y="22" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.4)" />
            <rect x="45" y="30" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.3)" />
            <rect x="64" y="30" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.6)" />
            <rect x="45" y="38" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.5)" />
            <rect x="64" y="38" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.2)" />
            <rect x="45" y="46" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.4)" />
            <rect x="64" y="46" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.7)" />
            <rect x="82" y="22" width="32" height="41" rx="1.5" fill="rgba(255,255,255,0.05)" />
            <rect x="88" y="27" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.45)" />
            <rect x="103" y="27" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.3)" />
            <rect x="88" y="35" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.6)" />
            <rect x="103" y="35" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.2)" />
            <rect x="88" y="43" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.3)" />
            <rect x="103" y="43" width="4" height="3" rx="0.5" fill="rgba(255,210,100,0.55)" />
            <rect x="120" y="15" width="42" height="48" rx="1.5" fill="rgba(255,255,255,0.07)" />
            <rect x="127" y="20" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.4)" />
            <rect x="150" y="20" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.6)" />
            <rect x="127" y="28" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.65)" />
            <rect x="150" y="28" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.3)" />
            <rect x="127" y="36" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.25)" />
            <rect x="150" y="36" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.5)" />
            <rect x="127" y="44" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.5)" />
            <rect x="150" y="44" width="5" height="3" rx="0.5" fill="rgba(255,210,100,0.35)" />
            <circle cx="36" cy="58" r="4" fill="rgba(43,122,111,0.25)" />
            <circle cx="117" cy="58" r="3.5" fill="rgba(43,122,111,0.2)" />
            <circle cx="165" cy="58" r="4.5" fill="rgba(43,122,111,0.22)" />
            <rect x="0" y="62" width="210" height="1" rx="0.5" fill="rgba(255,255,255,0.04)" />
          </svg>
        </div>

        {employee && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[13px] font-medium text-white/90">{employee.name}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>
              {ROLE_LABELS[employee.role]}
            </div>
            <button
              onClick={signOut}
              className="mt-2.5 flex items-center gap-1.5 text-[12px]"
              style={{
                color: 'rgba(255,255,255,0.35)',
                transition: `color var(--dur-ui) var(--ease-out)`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
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
