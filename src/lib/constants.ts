import type { ComplaintStatus, ComplaintPriority, ComplaintCategory, EmployeeRole, Department, FacilityType, EquipmentStatus, MaintenanceType, MaintenanceStatus, AnnouncementType, ShiftType } from './types'

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

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  gym: '헬스장',
  golf: '스크린골프',
  library: '독서실',
  sauna: '사우나',
  kids_cafe: '키즈카페',
  community: '커뮤니티센터',
  parking: '주차장',
  playground: '놀이터',
  other: '기타',
}

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  normal: '정상',
  broken: '고장',
  repairing: '수리중',
  disposed: '폐기',
}

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  normal: 'bg-green-100 text-green-800',
  broken: 'bg-red-100 text-red-800',
  repairing: 'bg-orange-100 text-orange-800',
  disposed: 'bg-slate-100 text-slate-500',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  repair: '수리',
  inspection: '점검',
  replacement: '교체',
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  pending: '대기',
  in_progress: '진행중',
  completed: '완료',
}

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  notice: '공지',
  urgent: '긴급',
  message: '전달',
}

export const ANNOUNCEMENT_TYPE_COLORS: Record<AnnouncementType, string> = {
  notice: 'bg-blue-100 text-blue-800',
  urgent: 'bg-red-100 text-red-800',
  message: 'bg-slate-100 text-slate-700',
}

export const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: '오전',
  afternoon: '오후',
  night: '야간',
}

export const SHIFT_COLORS: Record<ShiftType, string> = {
  morning: 'bg-amber-100 text-amber-800',
  afternoon: 'bg-sky-100 text-sky-800',
  night: 'bg-indigo-100 text-indigo-800',
}
