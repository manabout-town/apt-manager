'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { STATUS_LABELS, CATEGORY_LABELS } from '@/lib/constants'
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge'
import type { Complaint, ComplaintStatus, ComplaintCategory } from '@/lib/types'
import {
  ClipboardList,
  UserCheck,
  Loader,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wrench,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  received: number
  assigned: number
  in_progress: number
  completed: number
  overdue: number
  byCategory: Record<string, number>
}

interface FacilityStats {
  total: number
  normal: number
  broken: number
  repairing: number
  facilities: { name: string; broken: number; repairing: number }[]
}

const STAT_CARDS = [
  { key: 'received' as const, label: '접수', icon: ClipboardList, accent: '#B8860B' },
  { key: 'assigned' as const, label: '배정됨', icon: UserCheck, accent: '#4A7C91' },
  { key: 'in_progress' as const, label: '처리중', icon: Clock, accent: '#C07040' },
  { key: 'completed' as const, label: '완료', icon: CheckCircle2, accent: '#2B7A6F' },
]

export default function DashboardPage() {
  const { employee, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Complaint[]>([])
  const [overdue, setOverdue] = useState<Complaint[]>([])
  const [facilityStats, setFacilityStats] = useState<FacilityStats>({ total: 0, normal: 0, broken: 0, repairing: 0, facilities: [] })

  useEffect(() => {
    if (authLoading) return
    const supabase = createClient()

    async function load() {
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*, assigned_employee:employees!complaints_assigned_to_fkey(*)')

      if (!complaints) return

      const now = new Date()
      const s: Stats = {
        received: 0, assigned: 0, in_progress: 0, completed: 0, overdue: 0,
        byCategory: {},
      }

      const overdueList: Complaint[] = []

      for (const c of complaints) {
        s[c.status as ComplaintStatus]++
        s.byCategory[c.category] = (s.byCategory[c.category] || 0) + 1

        if (c.deadline && c.status !== 'completed' && new Date(c.deadline) < now) {
          s.overdue++
          overdueList.push(c)
        }
      }

      setStats(s)
      setOverdue(overdueList)

      const recentSorted = [...complaints]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
      setRecent(recentSorted)

      const { data: eqData } = await supabase
        .from('equipment')
        .select('*, facility:facilities(name)')

      if (eqData) {
        const fs: FacilityStats = { total: eqData.length, normal: 0, broken: 0, repairing: 0, facilities: [] }
        const byFacility: Record<string, { name: string; broken: number; repairing: number }> = {}
        for (const eq of eqData) {
          if (eq.status === 'normal') fs.normal++
          if (eq.status === 'broken') fs.broken++
          if (eq.status === 'repairing') fs.repairing++
          const fname = (eq.facility as { name: string })?.name || '기타'
          if (!byFacility[fname]) byFacility[fname] = { name: fname, broken: 0, repairing: 0 }
          if (eq.status === 'broken') byFacility[fname].broken++
          if (eq.status === 'repairing') byFacility[fname].repairing++
        }
        fs.facilities = Object.values(byFacility).filter((f) => f.broken > 0 || f.repairing > 0)
        setFacilityStats(fs)
      }
    }

    load()

    const channel = supabase
      .channel('complaints-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [authLoading])

  if (authLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ color: 'var(--text-disabled)' }}>
        <Loader className="animate-spin" size={28} />
      </div>
    )
  }

  const total = stats.received + stats.assigned + stats.in_progress + stats.completed

  return (
    <div className="page animate-fade-in">
      <div
        className="card overflow-hidden mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(43,122,111,0.06) 0%, var(--bg-surface) 60%)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {employee?.name}님, 안녕하세요
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
              오늘의 아파트 관리 현황을 확인하세요.
            </p>
          </div>
          <svg viewBox="0 0 160 60" className="hidden sm:block w-[140px] shrink-0" fill="none" aria-hidden="true">
            <rect x="2" y="22" width="22" height="36" rx="1.5" fill="rgba(43,122,111,0.12)" />
            <rect x="6" y="26" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.25)" />
            <rect x="16" y="26" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.35)" />
            <rect x="6" y="33" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="16" y="33" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="6" y="40" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.15)" />
            <rect x="16" y="40" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="28" y="8" width="32" height="50" rx="1.5" fill="rgba(43,122,111,0.16)" />
            <rect x="34" y="13" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="50" y="13" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="34" y="21" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.25)" />
            <rect x="50" y="21" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.35)" />
            <rect x="34" y="29" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.35)" />
            <rect x="50" y="29" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.15)" />
            <rect x="34" y="37" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="50" y="37" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="34" y="45" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="50" y="45" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="64" y="18" width="28" height="40" rx="1.5" fill="rgba(43,122,111,0.1)" />
            <rect x="70" y="23" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="84" y="23" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="70" y="31" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.15)" />
            <rect x="84" y="31" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.35)" />
            <rect x="70" y="39" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.25)" />
            <rect x="84" y="39" width="3.5" height="2.5" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="96" y="5" width="36" height="53" rx="1.5" fill="rgba(43,122,111,0.14)" />
            <rect x="103" y="10" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="123" y="10" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.35)" />
            <rect x="103" y="18" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="123" y="18" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.15)" />
            <rect x="103" y="26" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="123" y="26" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <rect x="103" y="34" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.35)" />
            <rect x="123" y="34" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.2)" />
            <rect x="103" y="42" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.25)" />
            <rect x="123" y="42" width="4" height="3" rx="0.5" fill="rgba(43,122,111,0.3)" />
            <circle cx="25" cy="54" r="3.5" fill="rgba(43,122,111,0.15)" />
            <circle cx="63" cy="54" r="3" fill="rgba(43,122,111,0.12)" />
            <circle cx="95" cy="54" r="3.5" fill="rgba(43,122,111,0.18)" />
            <circle cx="135" cy="54" r="4" fill="rgba(43,122,111,0.13)" />
            <rect x="0" y="57" width="160" height="1" rx="0.5" fill="rgba(43,122,111,0.08)" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ key, label, icon: Icon, accent }) => (
          <div key={key} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">{label}</span>
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: `${accent}10` }}
              >
                <Icon size={14} style={{ color: accent }} />
              </div>
            </div>
            <div className="stat-value">{stats[key]}</div>
          </div>
        ))}
      </div>

      {stats.overdue > 0 && (
        <div className="alert alert-error mb-6">
          <AlertTriangle size={16} className="shrink-0" />
          <div>
            <span className="font-medium">기한 초과 민원 {stats.overdue}건</span>
            <span className="opacity-70 ml-1.5">— 즉시 처리가 필요합니다</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="section-header">
            <span className="section-title">최근 민원</span>
            <Link href="/complaints" className="link">
              전체보기 <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {recent.length === 0 ? (
              <div className="p-10 text-center text-[13px]" style={{ color: 'var(--text-disabled)' }}>등록된 민원이 없습니다.</div>
            ) : (
              recent.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/complaints/${c.id}`}
                  className="flex items-center justify-between px-5 py-3"
                  style={{
                    borderBottom: i < recent.length - 1 ? '1px solid var(--surface-border)' : 'none',
                    transition: `background var(--dur-ui) var(--ease-out)`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-raised)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {c.unit_number && `${c.unit_number} · `}
                      {CATEGORY_LABELS[c.category as ComplaintCategory]}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <span className="section-title">카테고리별 현황</span>
          </div>
          <div className="p-5 space-y-3">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-[12px] w-20 shrink-0" style={{ color: 'var(--text-body)' }}>
                    {CATEGORY_LABELS[cat as ComplaintCategory]}
                  </span>
                  <div className="progress-track flex-1">
                    <div
                      className="progress-fill"
                      style={{
                        width: total ? `${(count / total) * 100}%` : '0%',
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold w-6 text-right" style={{ color: 'var(--text-primary)' }}>{count}</span>
                </div>
              ))}
            {Object.keys(stats.byCategory).length === 0 && (
              <div className="text-center text-[13px] py-4" style={{ color: 'var(--text-disabled)' }}>데이터 없음</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div className="flex items-center gap-2">
            <Wrench size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="section-title">시설 설비 현황</span>
          </div>
          <Link href="/facilities" className="link">
            전체보기 <ArrowRight size={12} />
          </Link>
        </div>
        <div className="p-5">
          <div className="flex gap-8 mb-4">
            {[
              { v: facilityStats.total, l: '전체', c: 'var(--text-primary)' },
              { v: facilityStats.normal, l: '정상', c: '#059669' },
              { v: facilityStats.broken, l: '고장', c: '#DC2626' },
              { v: facilityStats.repairing, l: '수리중', c: '#EA580C' },
            ].map(({ v, l, c }) => (
              <div key={l} className="text-center">
                <div className="text-[24px] font-bold" style={{ color: c, letterSpacing: '-0.03em' }}>{v}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
          {facilityStats.facilities.length > 0 && (
            <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--surface-border)' }}>
              {facilityStats.facilities.map((f) => (
                <div key={f.name} className="flex items-center gap-2 text-[13px]">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                  {f.broken > 0 && <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B' }}>고장 {f.broken}</span>}
                  {f.repairing > 0 && <span className="badge" style={{ background: '#FFEDD5', color: '#9A3412' }}>수리중 {f.repairing}</span>}
                </div>
              ))}
            </div>
          )}
          {facilityStats.total === 0 && (
            <div className="text-center text-[13px] py-2" style={{ color: 'var(--text-disabled)' }}>등록된 설비 없음</div>
          )}
        </div>
      </div>
    </div>
  )
}
