'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/StatusBadge'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { Complaint, ComplaintStatus, ComplaintCategory } from '@/lib/types'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function ComplaintsPage() {
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">민원 관리</h1>
        <Link
          href="/complaints/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          민원 접수
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목, 동호수, 신고자 검색..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | '')}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ComplaintCategory | '')}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">제목</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">카테고리</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">우선순위</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">담당자</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">기한</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">접수일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">로딩 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">민원이 없습니다.</td></tr>
              ) : (
                filtered.map((c) => {
                  const isOverdue = c.deadline && c.status !== 'completed' && new Date(c.deadline) < now
                  return (
                    <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <Link href={`/complaints/${c.id}`} className="text-slate-900 font-medium hover:text-blue-600">
                          {c.title}
                        </Link>
                        {c.unit_number && (
                          <div className="text-xs text-slate-500 mt-0.5">{c.unit_number}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <CategoryBadge category={c.category} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                        {c.assigned_employee?.name || '-'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {c.deadline ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            {new Date(c.deadline).toLocaleDateString('ko-KR')}
                            {isOverdue && ' (초과)'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
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

      <div className="text-sm text-slate-500">
        총 {filtered.length}건
      </div>
    </div>
  )
}
