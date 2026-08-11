'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { CleaningZone, CleaningTask } from '@/lib/types'
import {
  CheckCircle2,
  Circle,
  SprayCan,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function CleaningPage() {
  const { employee } = useAuth()
  const [zones, setZones] = useState<(CleaningZone & { tasks: CleaningTask[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set())
  const [newTaskZone, setNewTaskZone] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: zoneData } = await supabase
      .from('cleaning_zones')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (!zoneData) return

    const { data: taskData } = await supabase
      .from('cleaning_tasks')
      .select('*, completed_employee:employees!cleaning_tasks_completed_by_fkey(*)')
      .eq('date', selectedDate)

    const grouped = zoneData.map((z) => ({
      ...z,
      tasks: (taskData || []).filter((t) => t.zone_id === z.id),
    }))

    setZones(grouped)
    if (expandedZones.size === 0) {
      setExpandedZones(new Set(zoneData.map((z) => z.id)))
    }
    setLoading(false)
  }, [selectedDate])

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel('cleaning-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_tasks' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  async function toggleTask(task: CleaningTask) {
    const supabase = createClient()
    if (task.is_completed) {
      await supabase
        .from('cleaning_tasks')
        .update({ is_completed: false, completed_by: null, completed_at: null })
        .eq('id', task.id)
    } else {
      await supabase
        .from('cleaning_tasks')
        .update({
          is_completed: true,
          completed_by: employee?.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)
    }
    load()
  }

  async function addTask(zoneId: string) {
    if (!newTaskTitle.trim()) return
    const supabase = createClient()
    await supabase.from('cleaning_tasks').insert({
      zone_id: zoneId,
      title: newTaskTitle.trim(),
      date: selectedDate,
    })
    setNewTaskTitle('')
    setNewTaskZone(null)
    load()
  }

  function toggleZone(id: string) {
    setExpandedZones((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalTasks = zones.reduce((s, z) => s + z.tasks.length, 0)
  const completedTasks = zones.reduce((s, z) => s + z.tasks.filter((t) => t.is_completed).length, 0)
  const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" size={32} style={{ color: 'var(--text-disabled)' }} />
      </div>
    )
  }

  return (
    <div className="page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">미화 관리</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            {format(new Date(selectedDate), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input"
          style={{ minWidth: 0 }}
        />
      </div>

      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SprayCan size={18} style={{ color: 'var(--accent)' }} />
            <span className="section-title">오늘 진행률</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)' }}>
            {completedTasks}/{totalTasks} ({pct}%)
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${pct}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {zones.map((zone) => {
          const expanded = expandedZones.has(zone.id)
          const done = zone.tasks.filter((t) => t.is_completed).length
          const total = zone.tasks.length
          return (
            <div key={zone.id} className="card" style={{ overflow: 'hidden' }}>
              <button
                onClick={() => toggleZone(zone.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'background var(--dur-ui) var(--ease-out)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-raised)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {expanded
                    ? <ChevronDown size={18} style={{ color: 'var(--text-disabled)' }} />
                    : <ChevronRight size={18} style={{ color: 'var(--text-disabled)' }} />
                  }
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{zone.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {zone.floor && `${zone.floor}`}{zone.area && ` · ${zone.area}`}
                    </div>
                  </div>
                </div>
                <span
                  className="badge"
                  style={
                    total === 0
                      ? { background: 'var(--bg-surface-raised)', color: 'var(--text-muted)' }
                      : done === total
                        ? { background: 'rgba(16,185,129,0.1)', color: 'rgb(5,150,105)' }
                        : { background: 'rgba(245,158,11,0.1)', color: 'rgb(180,83,9)' }
                  }
                >
                  {done}/{total}
                </span>
              </button>

              {expanded && (
                <div style={{ borderTop: '1px solid var(--surface-border)' }}>
                  {zone.tasks.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-disabled)', textAlign: 'center' }}>등록된 항목 없음</div>
                  ) : (
                    <div>
                      {zone.tasks.map((task, i) => (
                        <div
                          key={task.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                            borderBottom: i < zone.tasks.length - 1 ? '1px solid var(--surface-border)' : undefined,
                          }}
                        >
                          <button onClick={() => toggleTask(task)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {task.is_completed ? (
                              <CheckCircle2 size={20} className="text-emerald-500" />
                            ) : (
                              <Circle size={20} style={{ color: 'var(--text-disabled)', transition: 'color var(--dur-ui) var(--ease-out)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgb(52,211,153)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-disabled)' }}
                              />
                            )}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                              fontSize: '13px',
                              color: task.is_completed ? 'var(--text-disabled)' : 'var(--text-body)',
                              textDecoration: task.is_completed ? 'line-through' : undefined,
                            }}>
                              {task.title}
                            </span>
                            {task.is_completed && task.completed_employee && (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                {(task.completed_employee as { name: string }).name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {newTaskZone === zone.id ? (
                    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask(zone.id)}
                        placeholder="항목 입력"
                        autoFocus
                        className="input"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <button
                        onClick={() => addTask(zone.id)}
                        className="btn btn-primary"
                      >
                        추가
                      </button>
                      <button
                        onClick={() => { setNewTaskZone(null); setNewTaskTitle('') }}
                        className="btn btn-secondary"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewTaskZone(zone.id)}
                      style={{
                        width: '100%', borderTop: '1px solid var(--surface-border)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', color: 'var(--text-muted)', padding: '12px 20px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        transition: 'color var(--dur-ui) var(--ease-out)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      <Plus size={16} /> 항목 추가
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
