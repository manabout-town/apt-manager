'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { Employee, EmployeeRole, Department } from '@/lib/types'
import { ROLE_LABELS, DEPARTMENT_LABELS } from '@/lib/constants'
import { Users, Plus, Pencil, X, Loader, Shield } from 'lucide-react'

export default function EmployeesPage() {
  const { employee: me } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name')
    if (data) setEmployees(data)
    setLoading(false)
  }

  async function toggleActive(emp: Employee) {
    if (me?.role !== 'admin') return
    const supabase = createClient()
    await supabase
      .from('employees')
      .update({ is_active: !emp.is_active })
      .eq('id', emp.id)
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" style={{ color: 'var(--text-disabled)' }} size={32} />
      </div>
    )
  }

  const active = employees.filter((e) => e.is_active)
  const inactive = employees.filter((e) => !e.is_active)

  return (
    <div className="page animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">직원 관리</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>총 {active.length}명 활동 중</p>
        </div>
        {me?.role === 'admin' && (
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={16} /> 직원 추가
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-left">이름</th>
                <th className="text-left">부서</th>
                <th className="text-left">직급</th>
                <th className="text-left">연락처</th>
                <th className="text-left">상태</th>
                {me?.role === 'admin' && (
                  <th className="text-right">관리</th>
                )}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className={`table-row ${!emp.is_active ? 'opacity-50' : ''}`}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emp.name}</span>
                      {emp.role === 'admin' && <Shield size={14} className="text-blue-500" />}
                    </div>
                  </td>
                  <td>{DEPARTMENT_LABELS[emp.department]}</td>
                  <td>
                    <span className={`badge ${
                      emp.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      emp.role === 'team_lead' ? 'bg-purple-100 text-purple-700' :
                      ''
                    }`} style={emp.role === 'staff' ? { background: 'var(--bg-surface-raised)', color: 'var(--text-body)' } : undefined}>
                      {ROLE_LABELS[emp.role]}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{emp.phone || '-'}</td>
                  <td>
                    <span className={`badge ${
                      emp.is_active ? 'bg-green-100 text-green-700' : ''
                    }`} style={!emp.is_active ? { background: 'var(--bg-surface-raised)', color: 'var(--text-muted)' } : undefined}>
                      {emp.is_active ? '활동' : '비활성'}
                    </span>
                  </td>
                  {me?.role === 'admin' && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditing(emp); setShowForm(true) }}
                          className="p-1 hover:opacity-70" style={{ color: 'var(--text-muted)' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleActive(emp)}
                          className="text-xs hover:opacity-70" style={{ color: 'var(--text-muted)' }}
                        >
                          {emp.is_active ? '비활성화' : '활성화'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <EmployeeForm
          employee={editing}
          onDone={() => { setShowForm(false); setEditing(null); load() }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function EmployeeForm({
  employee,
  onDone,
  onCancel,
}: {
  employee: Employee | null
  onDone: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(employee?.name || '')
  const [phone, setPhone] = useState(employee?.phone || '')
  const [role, setRole] = useState<EmployeeRole>(employee?.role || 'staff')
  const [department, setDepartment] = useState<Department>(employee?.department || 'facility')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const data = {
      name: name.trim(),
      phone: phone.trim() || null,
      role,
      department,
    }

    if (employee) {
      await supabase.from('employees').update(data).eq('id', employee.id)
    } else {
      await supabase.from('employees').insert(data)
    }
    onDone()
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={submit} className="modal-content p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">
            {employee ? '직원 수정' : '직원 추가'}
          </h2>
          <button type="button" onClick={onCancel}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="input w-full"
        />
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="연락처"
          className="input w-full"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department)}
            className="input"
          >
            <option value="management">관리</option>
            <option value="facility">시설</option>
            <option value="cleaning">미화</option>
            <option value="security">경비</option>
            <option value="other">기타</option>
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as EmployeeRole)}
            className="input"
          >
            <option value="staff">담당자</option>
            <option value="team_lead">팀장</option>
            <option value="admin">관리자</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="btn btn-primary w-full"
        >
          {saving ? '저장 중...' : employee ? '수정' : '추가'}
        </button>
      </form>
    </div>
  )
}
