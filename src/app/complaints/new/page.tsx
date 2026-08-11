'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { CATEGORY_LABELS, PRIORITY_LABELS } from '@/lib/constants'
import type { Employee, ComplaintCategory, ComplaintPriority } from '@/lib/types'
import { ArrowLeft, ImagePlus, X as XIcon } from 'lucide-react'
import Link from 'next/link'

export default function NewComplaintPage() {
  const router = useRouter()
  const { employee } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

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

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i])
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()

    const photoUrls: string[] = []
    for (const file of photos) {
      const ext = file.name.split('.').pop()
      const path = `complaints/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file)
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
        photoUrls.push(urlData.publicUrl)
      }
    }

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
      photos: photoUrls,
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
    <div className="page animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/complaints" style={{ color: 'var(--text-disabled)' }} className="hover:opacity-70">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-title">민원 접수</h1>
      </div>

      <form onSubmit={handleSubmit} className="card divide-y" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="p-5 space-y-4">
          <h2 className="section-title">민원 정보</h2>

          <div>
            <label className="label mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
              className="input w-full"
              placeholder="민원 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="label mb-1">상세 내용</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              className="input w-full resize-none"
              placeholder="민원 상세 내용..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="input w-full"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1">우선순위</label>
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className="input w-full"
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="section-title">신고자 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1">이름</label>
              <input
                type="text"
                value={form.reporter_name}
                onChange={(e) => update('reporter_name', e.target.value)}
                className="input w-full"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="label mb-1">동/호수</label>
              <input
                type="text"
                value={form.unit_number}
                onChange={(e) => update('unit_number', e.target.value)}
                className="input w-full"
                placeholder="101동 1201호"
              />
            </div>
          </div>
          <div>
            <label className="label mb-1">연락처</label>
            <input
              type="tel"
              value={form.reporter_phone}
              onChange={(e) => update('reporter_phone', e.target.value)}
              className="input w-full"
              placeholder="010-1234-5678"
            />
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="section-title">사진 첨부</h2>
          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={src} alt="" className="w-full h-full object-cover rounded-md" style={{ border: '1px solid var(--surface-border)' }} />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:opacity-70 transition-opacity" style={{ borderColor: 'var(--surface-border-strong)' }}>
              <ImagePlus size={20} style={{ color: 'var(--text-disabled)' }} />
              <span className="text-[10px] mt-1" style={{ color: 'var(--text-disabled)' }}>추가</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            </label>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="section-title">처리 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1">담당자 배정</label>
              <select
                value={form.assigned_to}
                onChange={(e) => update('assigned_to', e.target.value)}
                className="input w-full"
              >
                <option value="">미배정</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1">처리 기한</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => update('deadline', e.target.value)}
                className="input w-full min-w-0"
              />
            </div>
          </div>
        </div>

        <div className="p-5 flex justify-end gap-3">
          <Link href="/complaints" className="btn btn-secondary">
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary disabled:opacity-50"
          >
            {saving ? '저장 중...' : '접수하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
