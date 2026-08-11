'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Budget } from '@/lib/types'
import { DEPARTMENT_LABELS } from '@/lib/constants'
import type { Department } from '@/lib/types'
import { Wallet, TrendingUp, AlertTriangle, Plus, X, Loader } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    load()
  }, [year, month])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .order('department')
    if (data) setBudgets(data)
    setLoading(false)
  }

  const totalPlanned = budgets.reduce((s, b) => s + b.planned_amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent_amount, 0)
  const totalRemaining = totalPlanned - totalSpent
  const usageRate = totalPlanned ? Math.round((totalSpent / totalPlanned) * 100) : 0

  const chartData = budgets.map((b) => ({
    name: b.note || b.category,
    계획: b.planned_amount / 10000,
    집행: b.spent_amount / 10000,
  }))

  const overBudget = budgets.filter((b) => b.spent_amount > b.planned_amount)

  function fmt(n: number) {
    return new Intl.NumberFormat('ko-KR').format(n)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" style={{ color: 'var(--text-disabled)' }} size={32} />
      </div>
    )
  }

  return (
    <div className="page animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">예산 관리</h1>
        <div className="flex items-center gap-3">
          <select
            value={`${year}-${month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setYear(y)
              setMonth(m)
            }}
            className="input"
          >
            {[7, 8, 9].map((m) => (
              <option key={m} value={`2026-${m}`}>2026년 {m}월</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={16} /> 예산 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">총 예산</span>
            <Wallet size={16} className="text-blue-500" />
          </div>
          <div className="stat-value mt-2">{fmt(totalPlanned)}원</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">집행액</span>
            <TrendingUp size={16} className="text-orange-500" />
          </div>
          <div className="stat-value mt-2" style={{ color: 'var(--accent)' }}>{fmt(totalSpent)}원</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">잔여</span>
          <div className={`stat-value mt-2 ${totalRemaining < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {fmt(totalRemaining)}원
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">집행률</span>
          <div className="stat-value mt-2">{usageRate}%</div>
          <div className="progress-track mt-1">
            <div
              className={`progress-fill ${usageRate > 90 ? 'bg-red-500' : usageRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(usageRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {overBudget.length > 0 && (
        <div className="alert alert-error flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <span>
            예산 초과 항목 {overBudget.length}건: {overBudget.map((b) => b.note || b.category).join(', ')}
          </span>
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <h2 className="section-title">예산 vs 집행 (만원)</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString('ko-KR')}만원`} />
              <Legend />
              <Bar dataKey="계획" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="집행" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-left">부서</th>
                <th className="text-left">항목</th>
                <th className="text-right">계획</th>
                <th className="text-right">집행</th>
                <th className="text-right">잔여</th>
                <th className="text-right">집행률</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => {
                const remain = b.planned_amount - b.spent_amount
                const rate = b.planned_amount ? Math.round((b.spent_amount / b.planned_amount) * 100) : 0
                return (
                  <tr key={b.id} className={`table-row ${remain < 0 ? 'bg-red-50' : ''}`}>
                    <td>
                      {DEPARTMENT_LABELS[b.department as Department]}
                    </td>
                    <td className="font-medium">{b.note || b.category}</td>
                    <td className="text-right">{fmt(b.planned_amount)}</td>
                    <td className="text-right">{fmt(b.spent_amount)}</td>
                    <td className={`text-right font-medium ${remain < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {fmt(remain)}
                    </td>
                    <td className="text-right">
                      <span className={`badge ${
                        rate > 90 ? 'bg-red-100 text-red-700' : rate > 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
              {budgets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--text-disabled)' }}>
                    등록된 예산이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <BudgetForm
          year={year}
          month={month}
          onDone={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function BudgetForm({
  year, month, onDone, onCancel,
}: {
  year: number; month: number; onDone: () => void; onCancel: () => void
}) {
  const [department, setDepartment] = useState('facility')
  const [category, setCategory] = useState('')
  const [planned, setPlanned] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!planned) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('budgets').insert({
      year, month,
      department,
      category: category || 'general',
      planned_amount: parseInt(planned),
      note: note || null,
    })
    onDone()
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={submit} className="modal-content p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">예산 항목 추가</h2>
          <button type="button" onClick={onCancel}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="input w-full"
        >
          <option value="facility">시설</option>
          <option value="cleaning">미화</option>
          <option value="security">경비</option>
          <option value="management">관리</option>
        </select>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="분류 (예: maintenance, equipment)"
          className="input w-full"
        />
        <input
          type="number"
          value={planned}
          onChange={(e) => setPlanned(e.target.value)}
          placeholder="계획 금액 (원)"
          className="input w-full"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="비고"
          className="input w-full"
        />
        <button
          type="submit"
          disabled={saving || !planned}
          className="btn btn-primary w-full"
        >
          {saving ? '저장 중...' : '등록'}
        </button>
      </form>
    </div>
  )
}
