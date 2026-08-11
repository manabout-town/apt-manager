import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS } from '@/lib/constants'
import type { ComplaintStatus, ComplaintPriority, ComplaintCategory } from '@/lib/types'

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

export function CategoryBadge({ category }: { category: ComplaintCategory }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
      {CATEGORY_LABELS[category]}
    </span>
  )
}
