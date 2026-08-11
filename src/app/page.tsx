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

const STAT_CARDS = [
  { key: 'received' as const, label: '접수', icon: ClipboardList, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: 'assigned' as const, label: '배정됨', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'in_progress' as const, label: '처리중', icon: Loader, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'completed' as const, label: '완료', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
]

export default function DashboardPage() {
  const { employee, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Complaint[]>([])
  const [overdue, setOverdue] = useState<Complaint[]>([])

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
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  const total = stats.received + stats.assigned + stats.in_progress + stats.completed

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <p className="text-sm text-slate-500 mt-1">
          {employee?.name}님, 오늘 민원 현황입니다.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats[key]}</div>
          </div>
        ))}
      </div>

      {stats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-800">
              기한 초과 민원 {stats.overdue}건
            </div>
            <div className="text-xs text-red-600 mt-0.5">즉시 처리가 필요합니다.</div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">최근 민원</h2>
            <Link href="/complaints" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              전체보기 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">등록된 민원이 없습니다.</div>
            ) : (
              recent.map((c) => (
                <Link
                  key={c.id}
                  href={`/complaints/${c.id}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {c.unit_number && `${c.unit_number}동 · `}
                      {CATEGORY_LABELS[c.category as ComplaintCategory]}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">카테고리별 현황</h2>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-24 shrink-0">
                    {CATEGORY_LABELS[cat as ComplaintCategory]}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: total ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-8 text-right">{count}</span>
                </div>
              ))}
            {Object.keys(stats.byCategory).length === 0 && (
              <div className="text-center text-sm text-slate-400 py-4">데이터 없음</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
