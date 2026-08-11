'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/StatusBadge'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { Complaint, ComplaintStatus, ComplaintCategory } from '@/lib/types'
import { Plus, Search, Filter, AlertTriangle, ArrowUp } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/components/AuthProvider'

export default function ComplaintsPage() {
  const { employee } = useAuth()
  const { addToast } = useToast()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | ''>('')

  useEffect(() => {
    load()

    const supabase = createClient()
    const channel = supabase
      .channel('complaints-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, (payload) => {
        addToast(`새 민원 접수: ${(payload.new as Complaint).title}`, 'warning')
        load()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'complaints' }, (payload) => {
        const c = payload.new as Complaint
        if (c.status === 'completed') {
          addToast(`민원 완료: ${c.title}`, 'success')
        }
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('complaints')
      .select('*, assigned_employee:employees!complaints_assigned_to_fkey(*)')
      .order('created_at', { ascending: false })

    setComplaints(data || [])
    setLoading(false)
  }

  const filtered = complaints.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false
    if (categoryFilter && c.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        c.unit_number?.toLowerCase().includes(q) ||
        c.reporter_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const now = new Date()

  return (
    <div className="page animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title">민원 관리</h1>
        <Link href="/complaints/new" className="btn btn-primary">
          <Plus size={16} />
          민원 접수
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-disabled)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목, 동호수, 신고자 검색..."
            className="input w-full pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | '')}
          className="input"
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ComplaintCategory | '')}
          className="input"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-left">제목</th>
                <th className="text-left hidden sm:table-cell">카테고리</th>
                <th className="text-left">상태</th>
                <th className="text-left hidden md:table-cell">우선순위</th>
                <th className="text-left hidden md:table-cell">담당자</th>
                <th className="text-left hidden lg:table-cell">기한</th>
                <th className="text-left">접수일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--text-disabled)' }}>로딩 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--text-disabled)' }}>민원이 없습니다.</td></tr>
              ) : (
                filtered.map((c) => {
                  const isOverdue = c.deadline && c.status !== 'completed' && new Date(c.deadline) < now
                  const overdueDays = c.deadline && c.status !== 'completed' ? differenceInDays(now, new Date(c.deadline)) : 0
                  const needsEscalation = overdueDays >= 3 && c.priority !== 'urgent'
                  return (
                    <tr key={c.id} className={`table-row ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/complaints/${c.id}`} className="link font-medium" style={{ color: 'var(--text-primary)' }}>
                            {c.title}
                          </Link>
                          {needsEscalation && (
                            <span title={`${overdueDays}일 초과 — 에스컬레이션 필요`}>
                              <ArrowUp size={14} className="text-red-500" />
                            </span>
                          )}
                        </div>
                        {c.unit_number && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.unit_number}</div>
                        )}
                      </td>
                      <td className="hidden sm:table-cell">
                        <CategoryBadge category={c.category} />
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="hidden md:table-cell">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="hidden md:table-cell" style={{ color: 'var(--text-body)' }}>
                        {c.assigned_employee?.name || '-'}
                      </td>
                      <td className="hidden lg:table-cell">
                        {c.deadline ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''} style={!isOverdue ? { color: 'var(--text-body)' } : undefined}>
                            {new Date(c.deadline).toLocaleDateString('ko-KR')}
                            {isOverdue && ' (초과)'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ko })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
        총 {filtered.length}건
      </div>
    </div>
  )
}
