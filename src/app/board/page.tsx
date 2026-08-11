'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { Announcement, WorkLog, AnnouncementType, ShiftType, Employee } from '@/lib/types'
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_COLORS,
  SHIFT_LABELS,
  SHIFT_COLORS,
} from '@/lib/constants'
import {
  Megaphone,
  Pin,
  Plus,
  ClipboardList,
  Loader,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type Tab = 'announcements' | 'worklogs'

export default function BoardPage() {
  const { employee } = useAuth()
  const [tab, setTab] = useState<Tab>('announcements')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadAnnouncements = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('announcements')
      .select('*, author:employees!announcements_author_id_fkey(*)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
  }, [])

  const loadWorkLogs = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('work_logs')
      .select('*, employee:employees!work_logs_employee_id_fkey(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setWorkLogs(data)
  }, [])

  useEffect(() => {
    Promise.all([loadAnnouncements(), loadWorkLogs()]).then(() => setLoading(false))
    const supabase = createClient()
    const ch1 = supabase
      .channel('announcements-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => loadAnnouncements())
      .subscribe()
    const ch2 = supabase
      .channel('worklogs-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_logs' }, () => loadWorkLogs())
      .subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2) }
  }, [loadAnnouncements, loadWorkLogs])

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
        <h1 className="page-title">소통</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          {tab === 'announcements' ? '공지 작성' : '일지 작성'}
        </button>
      </div>

      <div className="tab-bar">
        <button
          onClick={() => { setTab('announcements'); setShowForm(false) }}
          className={`tab-item ${tab === 'announcements' ? 'tab-item-active' : ''}`}
        >
          <Megaphone size={16} /> 공지사항
        </button>
        <button
          onClick={() => { setTab('worklogs'); setShowForm(false) }}
          className={`tab-item ${tab === 'worklogs' ? 'tab-item-active' : ''}`}
        >
          <ClipboardList size={16} /> 근무일지
        </button>
      </div>

      {showForm && tab === 'announcements' && (
        <AnnouncementForm
          employeeId={employee?.id || ''}
          onDone={() => { setShowForm(false); loadAnnouncements() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showForm && tab === 'worklogs' && (
        <WorkLogForm
          employeeId={employee?.id || ''}
          onDone={() => { setShowForm(false); loadWorkLogs() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {tab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-disabled)' }}>
              <span style={{ fontSize: '13px' }}>등록된 공지사항이 없습니다.</span>
            </div>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  ...(a.is_pinned ? { boxShadow: '0 0 0 1px rgba(37,99,235,0.15), 0 1px 2px rgba(15,15,20,0.04)', background: 'var(--accent-subtle)' } : {}),
                }}
              >
                <div className="flex items-start gap-3">
                  {a.is_pinned && <Pin size={16} className="text-blue-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${ANNOUNCEMENT_TYPE_COLORS[a.type]}`}>
                        {ANNOUNCEMENT_TYPE_LABELS[a.type]}
                      </span>
                      <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{a.title}</h3>
                    </div>
                    {a.content && (
                      <p style={{ color: 'var(--text-body)', fontSize: '13px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{a.content}</p>
                    )}
                    <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>
                      <span>{(a.author as Employee)?.name}</span>
                      <span>{format(new Date(a.created_at), 'M/d HH:mm', { locale: ko })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'worklogs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workLogs.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-disabled)' }}>
              <span style={{ fontSize: '13px' }}>등록된 근무일지가 없습니다.</span>
            </div>
          ) : (
            workLogs.map((w) => (
              <div key={w.id} className="card" style={{ padding: '16px 20px' }}>
                <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '13px' }}>
                    {format(new Date(w.date), 'M월 d일 (EEE)', { locale: ko })}
                  </span>
                  <span className={`badge ${SHIFT_COLORS[w.shift]}`}>
                    {SHIFT_LABELS[w.shift]}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {(w.employee as Employee)?.name}
                  </span>
                </div>
                <p style={{ color: 'var(--text-body)', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{w.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function AnnouncementForm({
  employeeId,
  onDone,
  onCancel,
}: {
  employeeId: string
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<AnnouncementType>('notice')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('announcements').insert({
      title: title.trim(),
      content: content.trim() || null,
      type,
      author_id: employeeId,
      is_pinned: pinned,
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="flex items-center justify-between">
        <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>공지 작성</h2>
        <button type="button" onClick={onCancel}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
      </div>
      <div className="flex gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AnnouncementType)}
          className="input"
        >
          <option value="notice">공지</option>
          <option value="urgent">긴급</option>
          <option value="message">전달</option>
        </select>
        <label className="flex items-center gap-1.5" style={{ color: 'var(--text-body)', fontSize: '13px' }}>
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          상단 고정
        </label>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="input"
        style={{ width: '100%' }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용 (선택)"
        rows={4}
        className="input"
        style={{ width: '100%', resize: 'none' }}
      />
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {saving ? '저장 중...' : '등록'}
      </button>
    </form>
  )
}

function WorkLogForm({
  employeeId,
  onDone,
  onCancel,
}: {
  employeeId: string
  onDone: () => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [shift, setShift] = useState<ShiftType>('morning')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('work_logs').insert({
      employee_id: employeeId,
      date,
      shift,
      content: content.trim(),
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="flex items-center justify-between">
        <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>근무일지 작성</h2>
        <button type="button" onClick={onCancel}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
      </div>
      <div className="flex gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input min-w-0"
        />
        <select
          value={shift}
          onChange={(e) => setShift(e.target.value as ShiftType)}
          className="input"
        >
          <option value="morning">오전</option>
          <option value="afternoon">오후</option>
          <option value="night">야간</option>
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="근무 내용"
        rows={5}
        className="input"
        style={{ width: '100%', resize: 'none' }}
      />
      <button
        type="submit"
        disabled={saving || !content.trim()}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {saving ? '저장 중...' : '등록'}
      </button>
    </form>
  )
}
