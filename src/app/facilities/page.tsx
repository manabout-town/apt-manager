'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FACILITY_TYPE_LABELS, EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_COLORS } from '@/lib/constants'
import type { Facility, Equipment, EquipmentStatus } from '@/lib/types'
import { Building, ChevronRight, AlertTriangle, CheckCircle2, Wrench, XCircle } from 'lucide-react'
import Link from 'next/link'

interface FacilityWithStats extends Facility {
  equipment: Equipment[]
  stats: Record<EquipmentStatus, number>
  total: number
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilityWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel('equipment-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('facilities')
      .select('*, equipment(*)')
      .eq('is_active', true)
      .order('name')

    if (data) {
      const withStats = data.map((f) => {
        const stats: Record<EquipmentStatus, number> = { normal: 0, broken: 0, repairing: 0, disposed: 0 }
        for (const eq of f.equipment || []) {
          stats[eq.status as EquipmentStatus]++
        }
        return { ...f, stats, total: (f.equipment || []).length }
      })
      setFacilities(withStats)
    }
    setLoading(false)
  }

  const totalEquipment = facilities.reduce((s, f) => s + f.total, 0)
  const totalBroken = facilities.reduce((s, f) => s + f.stats.broken, 0)
  const totalRepairing = facilities.reduce((s, f) => s + f.stats.repairing, 0)
  const totalNormal = facilities.reduce((s, f) => s + f.stats.normal, 0)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">시설 관리</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">전체 설비</span>
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
              <Building size={16} className="text-slate-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalEquipment}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">정상</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-green-700">{totalNormal}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">고장</span>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle size={16} className="text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-700">{totalBroken}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">수리중</span>
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-700">{totalRepairing}</div>
        </div>
      </div>

      {(totalBroken > 0 || totalRepairing > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            고장 {totalBroken}건, 수리중 {totalRepairing}건 — 조치 필요
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-slate-400 py-12">로딩 중...</div>
        ) : (
          facilities.map((f) => {
            const hasIssue = f.stats.broken > 0 || f.stats.repairing > 0
            return (
              <Link
                key={f.id}
                href={`/facilities/${f.id}`}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
                  hasIssue ? 'border-amber-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500">{FACILITY_TYPE_LABELS[f.type]}</div>
                    <h3 className="text-lg font-semibold text-slate-900 mt-0.5">{f.name}</h3>
                    {f.location && <div className="text-sm text-slate-500 mt-1">{f.location}</div>}
                  </div>
                  <ChevronRight size={18} className="text-slate-400 mt-1" />
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  {(Object.entries(f.stats) as [EquipmentStatus, number][])
                    .filter(([, count]) => count > 0)
                    .map(([status, count]) => (
                      <span
                        key={status}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${EQUIPMENT_STATUS_COLORS[status]}`}
                      >
                        {EQUIPMENT_STATUS_LABELS[status]} {count}
                      </span>
                    ))}
                  {f.total === 0 && (
                    <span className="text-xs text-slate-400">등록된 설비 없음</span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
