'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import {
  FACILITY_TYPE_LABELS, EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_COLORS,
  MAINTENANCE_TYPE_LABELS, MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS,
} from '@/lib/constants'
import type { Facility, Equipment, MaintenanceLog, Employee, EquipmentStatus, MaintenanceType, MaintenanceStatus } from '@/lib/types'
import { ArrowLeft, Plus, Wrench, History, X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { employee } = useAuth()
  const [facility, setFacility] = useState<Facility | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [showAddLog, setShowAddLog] = useState<string | null>(null)

  const [eqForm, setEqForm] = useState({ name: '', model: '', installed_at: '' })
  const [logForm, setLogForm] = useState({ type: 'repair' as MaintenanceType, title: '', description: '', assigned_to: '' })

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel(`facility-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment', filter: `facility_id=eq.${id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_logs', filter: `facility_id=eq.${id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function load() {
    const supabase = createClient()
    const [fRes, eqRes, logRes, empRes] = await Promise.all([
      supabase.from('facilities').select('*').eq('id', id).single(),
      supabase.from('equipment').select('*').eq('facility_id', id).order('name'),
      supabase.from('maintenance_logs').select('*, equipment(*), assigned_employee:employees!maintenance_logs_assigned_to_fkey(*)').eq('facility_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('employees').select('*').eq('is_active', true).order('name'),
    ])
    setFacility(fRes.data)
    setEquipment(eqRes.data || [])
    setLogs(logRes.data || [])
    setEmployees(empRes.data || [])
    setLoading(false)
  }

  async function updateEquipmentStatus(eqId: string, status: EquipmentStatus) {
    const supabase = createClient()
    await supabase.from('equipment').update({ status }).eq('id', eqId)
    load()
  }

  async function addEquipment(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('equipment').insert({
      facility_id: id,
      name: eqForm.name,
      model: eqForm.model || null,
      installed_at: eqForm.installed_at || null,
    })
    setEqForm({ name: '', model: '', installed_at: '' })
    setShowAddEquipment(false)
    load()
  }

  async function addMaintenanceLog(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('maintenance_logs').insert({
      equipment_id: showAddLog,
      facility_id: id,
      type: logForm.type,
      title: logForm.title,
      description: logForm.description || null,
      assigned_to: logForm.assigned_to || null,
      status: 'pending',
      created_by: employee?.id,
    })
    setLogForm({ type: 'repair', title: '', description: '', assigned_to: '' })
    setShowAddLog(null)
    load()
  }

  async function updateLogStatus(logId: string, status: MaintenanceStatus) {
    const supabase = createClient()
    const updates: Record<string, unknown> = { status }
    if (status === 'completed') updates.completed_at = new Date().toISOString()
    if (status === 'in_progress') updates.started_at = new Date().toISOString()
    await supabase.from('maintenance_logs').update(updates).eq('id', logId)
    load()
  }

  if (loading || !facility) {
    return <div className="flex items-center justify-center h-screen text-slate-400">로딩 중...</div>
  }

  const now = new Date()
  const upcomingInspections = equipment.filter(
    (eq) => eq.next_inspection_at && new Date(eq.next_inspection_at) <= new Date(now.getTime() + 7 * 86400000)
  )

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/facilities" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="text-sm text-slate-500">{FACILITY_TYPE_LABELS[facility.type]}</div>
          <h1 className="text-xl font-bold text-slate-900">{facility.name}</h1>
          {facility.location && <div className="text-sm text-slate-500">{facility.location}</div>}
        </div>
      </div>

      {upcomingInspections.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-sm font-medium text-blue-800 mb-1">7일 이내 점검 예정</div>
          {upcomingInspections.map((eq) => (
            <div key={eq.id} className="text-sm text-blue-700">
              {eq.name} — {format(new Date(eq.next_inspection_at!), 'M월 d일')}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">설비 목록 ({equipment.length})</h2>
          <button
            onClick={() => setShowAddEquipment(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} /> 설비 추가
          </button>
        </div>

        {showAddEquipment && (
          <form onSubmit={addEquipment} className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">이름 *</label>
              <input type="text" required value={eqForm.name} onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="러닝머신 3" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">모델</label>
              <input type="text" value={eqForm.model} onChange={(e) => setEqForm({ ...eqForm, model: e.target.value })}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="모델명" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">설치일</label>
              <input type="date" value={eqForm.installed_at} onChange={(e) => setEqForm({ ...eqForm, installed_at: e.target.value })}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">추가</button>
              <button type="button" onClick={() => setShowAddEquipment(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">취소</button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {equipment.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">등록된 설비가 없습니다.</div>
          ) : (
            equipment.map((eq) => (
              <div key={eq.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{eq.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EQUIPMENT_STATUS_COLORS[eq.status]}`}>
                      {EQUIPMENT_STATUS_LABELS[eq.status]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {eq.model && <span>{eq.model}</span>}
                    {eq.installed_at && <span> · 설치 {eq.installed_at}</span>}
                    {eq.next_inspection_at && <span> · 다음 점검 {eq.next_inspection_at}</span>}
                  </div>
                  {eq.notes && <div className="text-xs text-amber-600 mt-1">{eq.notes}</div>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={eq.status}
                    onChange={(e) => updateEquipmentStatus(eq.id, e.target.value as EquipmentStatus)}
                    className="text-xs px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(EQUIPMENT_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setShowAddLog(eq.id); setLogForm({ type: 'repair', title: '', description: '', assigned_to: '' }) }}
                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="정비 기록 추가"
                  >
                    <Wrench size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddLog(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={addMaintenanceLog} className="bg-white rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">정비 기록 추가</h3>
              <button type="button" onClick={() => setShowAddLog(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="text-sm text-slate-500">
              {equipment.find((e) => e.id === showAddLog)?.name}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">유형</label>
                <select value={logForm.type} onChange={(e) => setLogForm({ ...logForm, type: e.target.value as MaintenanceType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">담당자</label>
                <select value={logForm.assigned_to} onChange={(e) => setLogForm({ ...logForm, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">미배정</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">제목 *</label>
              <input type="text" required value={logForm.title} onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="벨트 교체 작업" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">상세</label>
              <textarea value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="상세 내용..." />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddLog(null)} className="px-4 py-2 text-sm text-slate-600">취소</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">등록</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <History size={16} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">정비 이력</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">정비 이력이 없습니다.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{log.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MAINTENANCE_STATUS_COLORS[log.status]}`}>
                      {MAINTENANCE_STATUS_LABELS[log.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {MAINTENANCE_TYPE_LABELS[log.type]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {log.equipment?.name && <span>{log.equipment.name} · </span>}
                    {log.assigned_employee?.name && <span>담당: {log.assigned_employee.name} · </span>}
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </div>
                  {log.description && <div className="text-sm text-slate-600 mt-1">{log.description}</div>}
                </div>
                {log.status !== 'completed' && (
                  <select
                    value={log.status}
                    onChange={(e) => updateLogStatus(log.id, e.target.value as MaintenanceStatus)}
                    className="text-xs px-2 py-1 border border-slate-300 rounded-lg shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(MAINTENANCE_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                )}
                {log.status === 'completed' && (
                  <span className="text-xs text-green-600 shrink-0">
                    {log.completed_at && format(new Date(log.completed_at), 'M/d 완료')}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
