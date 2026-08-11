'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Complaint, ComplaintStatus, ComplaintCategory, EquipmentStatus } from '@/lib/types'
import { STATUS_LABELS, CATEGORY_LABELS, EQUIPMENT_STATUS_LABELS } from '@/lib/constants'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Download, Upload, Loader } from 'lucide-react'
import * as XLSX from 'xlsx'

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6b7280']

export default function ReportsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [equipmentData, setEquipmentData] = useState<{ status: string; count: number }[]>([])
  const [cleaningRate, setCleaningRate] = useState<{ zone: string; rate: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()

    const [{ data: cData }, { data: eqData }, { data: zones }, { data: tasks }] = await Promise.all([
      supabase.from('complaints').select('*'),
      supabase.from('equipment').select('status'),
      supabase.from('cleaning_zones').select('id, name').eq('is_active', true),
      supabase.from('cleaning_tasks').select('zone_id, is_completed').eq('date', new Date().toISOString().split('T')[0]),
    ])

    if (cData) setComplaints(cData)

    if (eqData) {
      const counts: Record<string, number> = {}
      for (const eq of eqData) {
        counts[eq.status] = (counts[eq.status] || 0) + 1
      }
      setEquipmentData(
        Object.entries(counts).map(([status, count]) => ({
          status: EQUIPMENT_STATUS_LABELS[status as EquipmentStatus],
          count,
        }))
      )
    }

    if (zones && tasks) {
      setCleaningRate(
        zones.map((z) => {
          const zTasks = tasks.filter((t) => t.zone_id === z.id)
          const done = zTasks.filter((t) => t.is_completed).length
          return { zone: z.name, rate: zTasks.length ? Math.round((done / zTasks.length) * 100) : 0 }
        })
      )
    }

    setLoading(false)
  }

  async function importComplaints(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)

    const catReverse = Object.fromEntries(Object.entries(CATEGORY_LABELS).map(([k, v]) => [v, k]))
    const supabase = createClient()
    let count = 0

    for (const row of rows) {
      const title = row['제목'] || row['title']
      if (!title) continue
      await supabase.from('complaints').insert({
        title,
        category: catReverse[row['카테고리']] || 'other',
        priority: row['우선순위'] || 'medium',
        reporter_name: row['신고자'] || null,
        unit_number: row['동호수'] || null,
        reporter_phone: row['연락처'] || null,
        status: 'received',
      })
      count++
    }
    alert(`${count}건 가져오기 완료`)
    load()
    e.target.value = ''
  }

  function exportComplaints() {
    const rows = complaints.map((c) => ({
      제목: c.title,
      카테고리: CATEGORY_LABELS[c.category as ComplaintCategory],
      상태: STATUS_LABELS[c.status as ComplaintStatus],
      우선순위: c.priority,
      신고자: c.reporter_name || '',
      동호수: c.unit_number || '',
      연락처: c.reporter_phone || '',
      접수일: c.created_at?.split('T')[0] || '',
      기한: c.deadline?.split('T')[0] || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '민원목록')
    XLSX.writeFile(wb, `민원목록_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const statusData = (() => {
    const counts: Record<string, number> = {}
    for (const c of complaints) {
      const label = STATUS_LABELS[c.status as ComplaintStatus]
      counts[label] = (counts[label] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  })()

  const categoryData = (() => {
    const counts: Record<string, number> = {}
    for (const c of complaints) {
      const label = CATEGORY_LABELS[c.category as ComplaintCategory]
      counts[label] = (counts[label] || 0) + 1
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  })()

  const repeatComplaints = (() => {
    const key = (c: Complaint) => `${c.unit_number}-${c.category}`
    const groups: Record<string, Complaint[]> = {}
    for (const c of complaints) {
      if (!c.unit_number) continue
      const k = key(c)
      if (!groups[k]) groups[k] = []
      groups[k].push(c)
    }
    return Object.entries(groups)
      .filter(([, list]) => list.length >= 2)
      .map(([, list]) => ({
        unit: list[0].unit_number,
        category: CATEGORY_LABELS[list[0].category as ComplaintCategory],
        count: list.length,
      }))
  })()

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
        <h1 className="page-title">보고서</h1>
        <div className="flex items-center gap-2">
          <label className="btn btn-secondary flex items-center gap-1.5 cursor-pointer">
            <Upload size={16} /> 엑셀 가져오기
            <input type="file" accept=".xlsx,.xls,.csv" onChange={importComplaints} className="hidden" />
          </label>
          <button
            onClick={exportComplaints}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Download size={16} /> 엑셀 내보내기
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">민원 상태별 현황</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}`}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h2 className="section-title">카테고리별 민원</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h2 className="section-title">설비 상태 현황</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={equipmentData} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="status" label={({ name, value }) => `${name} ${value}`}>
                  {equipmentData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h2 className="section-title">오늘 미화 완료율</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cleaningRate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="zone" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {repeatComplaints.length > 0 && (
        <div className="alert alert-warn">
          <h2 className="font-semibold mb-3">반복 민원 감지</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>동일 동호수 + 카테고리 민원이 2건 이상 접수된 항목</p>
          <div className="space-y-2">
            {repeatComplaints.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-medium">{r.unit}</span>
                <span style={{ color: 'var(--text-muted)' }}>{r.category}</span>
                <span className="badge bg-amber-100 text-amber-700">
                  {r.count}건
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
