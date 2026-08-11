'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-md mb-4"
            style={{ background: 'var(--bg-sidebar)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="9" height="14" rx="1.5" fill="rgba(43,122,111,0.6)" stroke="rgba(43,122,111,0.9)" strokeWidth="0.5" />
              <rect x="13" y="3" width="9" height="19" rx="1.5" fill="rgba(43,122,111,0.8)" stroke="rgba(43,122,111,1)" strokeWidth="0.5" />
              <rect x="4.5" y="11" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.7)" />
              <rect x="7.2" y="11" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.4)" />
              <rect x="4.5" y="14.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.5)" />
              <rect x="7.2" y="14.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.8)" />
              <rect x="15.5" y="6" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.6)" />
              <rect x="18.2" y="6" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.3)" />
              <rect x="15.5" y="9.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.4)" />
              <rect x="18.2" y="9.5" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.7)" />
              <rect x="15.5" y="13" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.8)" />
              <rect x="18.2" y="13" width="1.8" height="1.5" rx="0.3" fill="rgba(255,215,100,0.5)" />
              <line x1="1" y1="22.5" x2="23" y2="22.5" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">APT 관리</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>관리사무소 운영 시스템</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-md p-6 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--surface-border)' }}
        >
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-body)' }}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: '1px solid var(--surface-border-strong)', background: 'var(--bg-surface)' }}
              placeholder="admin@aptmanager.co.kr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-body)' }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: '1px solid var(--surface-border-strong)', background: 'var(--bg-surface)' }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white rounded text-sm font-medium disabled:opacity-50"
            style={{
              background: 'var(--bg-sidebar)',
              transition: `opacity var(--dur-ui) var(--ease-out)`,
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
