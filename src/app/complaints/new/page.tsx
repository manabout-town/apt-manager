'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { CATEGORY_LABELS, PRIORITY_LABELS } from '@/lib/constants'
import type { Employee, ComplaintCategory, ComplaintPriority } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewComplaintPage() {
  const router = useRouter()
  const { employee } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other' as ComplaintCategory,
    priority: 'medium' as ComplaintPriority,
    reporter_name: '',
    unit_number: '',
    reporter_phone: '',
    assigned_to: '',
    deadline: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setEmployees(data || []))
  }, [])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      priority: form.priority,
      reporter_name: form.reporter_name || null,
      unit_number: form.unit_number || null,
      reporter_phone: form.reporter_phone || null,
      assigned_to: form.assigned_to || null,
      deadline: form.deadline || null,
      status: form.assigned_to ? 'assigned' : 'received',
      created_by: employee?.id || null,
    }

    const { data, error } = await supabase
      .from('complaints')
      .insert(payload)
      .select()
      .single()

    if (error) {
      alert('저장 실패: ' + error.message)
      setSaving(false)
      return
    }

    if (form.assigned_to) {
      await supabase.from('complaint_logs').insert({
        complaint_id: data.id,
        employee_id: employee?.id,
        old_status: null,
        new_status: 'assigned',
        note: '민원 접수 시 담당자 배정',
      })
    }

    router.push(`/complaints/${data.id}`)
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/complaints" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">민원 접수</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">민원 정보</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="민원 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상세 내용</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="민원 상세 내용..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">우선순위</label>
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">신고자 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
              <input
                type="text"
                value={form.reporter_name}
                onChange={(e) => update('reporter_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">동/호수</label>
              <input
                type="text"
                value={form.unit_number}
                onChange={(e) => update('unit_number', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="101동 1201호"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
            <input
              type="tel"
              value={form.reporter_phone}
              onChange={(e) => update('reporter_phone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
            />
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">처리 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">담당자 배정</label>
              <select
                value={form.assigned_to}
                onChange={(e) => update('assigned_to', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">미배정</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">처리 기한</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => update('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
              />
            </div>
          </div>
        </div>

        <div className="p-5 flex justify-end gap-3">
          <Link
            href="/complaints"
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '접수하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
