import type { ComplaintStatus, ComplaintPriority, ComplaintCategory, EmployeeRole, Department } from './types'

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  received: '접수',
  assigned: '배정됨',
  in_progress: '처리중',
  completed: '완료',
}

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  received: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
}

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
}

export const PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  plumbing: '배관/수도',
  electrical: '전기',
  elevator: '엘리베이터',
  noise: '소음',
  parking: '주차',
  facility: '시설물',
  cleaning: '미화/청소',
  security: '보안/경비',
  other: '기타',
}

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  admin: '관리자',
  team_lead: '팀장',
  staff: '담당자',
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  management: '관리',
  facility: '시설',
  cleaning: '미화',
  security: '경비',
  other: '기타',
}
