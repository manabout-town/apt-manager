'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/StatusBadge'
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '@/lib/constants'
import type { Complaint, ComplaintComment, ComplaintLog, Employee, ComplaintStatus, ComplaintPriority } from '@/lib/types'
import { ArrowLeft, Clock, User, MessageSquare, History, Send } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'

const STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  received: ['assigned'],
  assigned: ['in_progress', 'received'],
  in_progress: ['completed', 'assigned'],
  completed: ['in_progress'],
}

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { employee } = useAuth()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [comments, setComments] = useState<ComplaintComment[]>([])
  const [logs, setLogs] = useState<ComplaintLog[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    load()

    const supabase = createClient()
    const channel = supabase
      .channel(`complaint-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `id=eq.${id}` }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaint_comments', filter: `complaint_id=eq.${id}` }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function load() {
    const supabase = createClient()

    const [cRes, commRes, logRes, empRes] = await Promise.all([
      supabase.from('complaints').select('*, assigned_employee:employees!complaints_assigned_to_fkey(*)').eq('id', id).single(),
      supabase.from('complaint_comments').select('*, employee:employees(*)').eq('complaint_id', id).order('created_at', { ascending: true }),
      supabase.from('complaint_logs').select('*, employee:employees(*)').eq('complaint_id', id).order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('is_active', true).order('name'),
    ])

    setComplaint(cRes.data)
    setComments(commRes.data || [])
    setLogs(logRes.data || [])
    setEmployees(empRes.data || [])
    setLoading(false)
  }

  async function updateStatus(newStatus: ComplaintStatus) {
    if (!complaint || !employee) return
    setUpdating(true)

    const supabase = createClient()
    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString()
    if (newStatus !== 'completed') updates.completed_at = null

    await supabase.from('complaints').update(updates).eq('id', id)
    await supabase.from('complaint_logs').insert({
      complaint_id: id,
      employee_id: employee.id,
      old_status: complaint.status,
      new_status: newStatus,
    })

    setUpdating(false)
    load()
  }

  async function updateField(field: string, value: string | null) {
    if (!complaint || !employee) return
    const supabase = createClient()

    const updates: Record<string, unknown> = { [field]: value }

    if (field === 'assigned_to' && value && complaint.status === 'received') {
      updates.status = 'assigned'
      await supabase.from('complaint_logs').insert({
        complaint_id: id,
        employee_id: employee.id,
        old_status: 'received',
        new_status: 'assigned',
        note: '담당자 배정',
      })
    }

    await supabase.from('complaints').update(updates).eq('id', id)
    load()
  }

  async function addComment() {
    if (!newComment.trim() || !employee) return
    const supabase = createClient()
    await supabase.from('complaint_comments').insert({
      complaint_id: id,
      employee_id: employee.id,
      content: newComment.trim(),
    })
    setNewComment('')
    load()
  }

  if (loading || !complaint) {
    return <div className="flex items-center justify-center h-screen" style={{ color: 'var(--text-disabled)' }}>로딩 중...</div>
  }

  const isOverdue = complaint.deadline && complaint.status !== 'completed' && new Date(complaint.deadline) < new Date()
  const transitions = STATUS_TRANSITIONS[complaint.status] || []

  return (
    <div className="page animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/complaints" style={{ color: 'var(--text-disabled)' }} className="hover:opacity-70">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{complaint.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <CategoryBadge category={complaint.category} />
            {isOverdue && (
              <span className="badge text-red-600 bg-red-50">기한 초과</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {complaint.description && (
            <div className="card p-5">
              <h2 className="section-title mb-3">상세 내용</h2>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-body)' }}>{complaint.description}</p>
            </div>
          )}

          <div className="card">
            <div className="section-header">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
                <span className="section-title">코멘트 ({comments.length})</span>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--surface-border)' }}>
              {comments.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.employee?.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-body)' }}>{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-disabled)' }}>코멘트가 없습니다.</div>
              )}
            </div>
            <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--surface-border)' }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addComment()}
                placeholder="코멘트 작성..."
                className="input flex-1"
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <div className="flex items-center gap-2">
                <History size={16} style={{ color: 'var(--text-muted)' }} />
                <span className="section-title">처리 이력</span>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--surface-border)' }}>
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-body)' }}>
                      {log.employee?.name && <span className="font-medium">{log.employee.name}</span>}
                      {log.old_status && (
                        <> {STATUS_LABELS[log.old_status]} → </>
                      )}
                      <span className="font-medium">{STATUS_LABELS[log.new_status]}</span>
                      {log.note && <span style={{ color: 'var(--text-muted)' }}> · {log.note}</span>}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>
                      {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-disabled)' }}>이력이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="section-title">상태 변경</h2>
            <div className="flex flex-wrap gap-2">
              {transitions.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updating}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  {STATUS_LABELS[s]}으로 변경
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="section-title">처리 정보</h2>

            <div>
              <label className="label mb-1">담당자</label>
              <select
                value={complaint.assigned_to || ''}
                onChange={(e) => updateField('assigned_to', e.target.value || null)}
                className="input w-full"
              >
                <option value="">미배정</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-1">우선순위</label>
              <select
                value={complaint.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                className="input w-full"
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-1">처리 기한</label>
              <input
                type="date"
                value={complaint.deadline ? complaint.deadline.slice(0, 10) : ''}
                onChange={(e) => updateField('deadline', e.target.value || null)}
                className="input w-full min-w-0"
              />
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="section-title">신고자 정보</h2>
            {complaint.reporter_name && (
              <div className="flex items-center gap-2 text-sm">
                <User size={14} style={{ color: 'var(--text-disabled)' }} />
                <span style={{ color: 'var(--text-body)' }}>{complaint.reporter_name}</span>
              </div>
            )}
            {complaint.unit_number && (
              <div className="text-sm" style={{ color: 'var(--text-body)' }}>{complaint.unit_number}</div>
            )}
            {complaint.reporter_phone && (
              <div className="text-sm" style={{ color: 'var(--text-body)' }}>{complaint.reporter_phone}</div>
            )}
            {!complaint.reporter_name && !complaint.unit_number && (
              <div className="text-sm" style={{ color: 'var(--text-disabled)' }}>정보 없음</div>
            )}
          </div>

          <div className="card p-5 space-y-2">
            <h2 className="section-title">타임라인</h2>
            <div className="text-sm flex items-center gap-2" style={{ color: 'var(--text-body)' }}>
              <Clock size={14} style={{ color: 'var(--text-disabled)' }} />
              접수: {format(new Date(complaint.created_at), 'yyyy-MM-dd HH:mm')}
            </div>
            {complaint.completed_at && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <Clock size={14} />
                완료: {format(new Date(complaint.completed_at), 'yyyy-MM-dd HH:mm')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
