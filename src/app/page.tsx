'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { STATUS_LABELS, CATEGORY_LABELS } from '@/lib/constants'
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge'
import type { Complaint, ComplaintStatus, ComplaintCategory, EquipmentStatus } from '@/lib/types'
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_COLORS } from '@/lib/constants'
import {
  ClipboardList,
  UserCheck,
  Loader,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wrench,
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

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">시설 설비 현황</h2>
          </div>
          <Link href="/facilities" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            전체보기 <ArrowRight size={12} />
          </Link>
        </div>
        <div className="p-4">
          <div className="flex gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{facilityStats.total}</div>
              <div className="text-xs text-slate-500">전체</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{facilityStats.normal}</div>
              <div className="text-xs text-slate-500">정상</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{facilityStats.broken}</div>
              <div className="text-xs text-slate-500">고장</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700">{facilityStats.repairing}</div>
              <div className="text-xs text-slate-500">수리중</div>
            </div>
          </div>
          {facilityStats.facilities.length > 0 && (
            <div className="space-y-2">
              {facilityStats.facilities.map((f) => (
                <div key={f.name} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-700 font-medium">{f.name}</span>
                  {f.broken > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">고장 {f.broken}</span>}
                  {f.repairing > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">수리중 {f.repairing}</span>}
                </div>
              ))}
            </div>
          )}
          {facilityStats.total === 0 && (
            <div className="text-center text-sm text-slate-400 py-2">등록된 설비 없음</div>
          )}
        </div>
      </div>
    </div>
  )
}
