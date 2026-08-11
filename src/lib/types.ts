export type EmployeeRole = 'admin' | 'team_lead' | 'staff'
export type Department = 'management' | 'facility' | 'cleaning' | 'security' | 'other'
export type ComplaintStatus = 'received' | 'assigned' | 'in_progress' | 'completed'
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ComplaintCategory =
  | 'plumbing' | 'electrical' | 'elevator' | 'noise'
  | 'parking' | 'facility' | 'cleaning' | 'security' | 'other'

export interface Employee {
  id: string
  auth_id: string | null
  name: string
  phone: string | null
  role: EmployeeRole
  department: Department
  is_active: boolean
  created_at: string
}

export interface Complaint {
  id: string
  title: string
  description: string | null
  category: ComplaintCategory
  status: ComplaintStatus
  priority: ComplaintPriority
  reporter_name: string | null
  unit_number: string | null
  reporter_phone: string | null
  assigned_to: string | null
  assigned_employee?: Employee | null
  deadline: string | null
  completed_at: string | null
  photos: string[]
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ComplaintComment {
  id: string
  complaint_id: string
  employee_id: string
  employee?: Employee
  content: string
  created_at: string
}

export interface ComplaintLog {
  id: string
  complaint_id: string
  employee_id: string | null
  employee?: Employee
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus
  note: string | null
  created_at: string
}

export type FacilityType =
  | 'gym' | 'golf' | 'library' | 'sauna' | 'kids_cafe'
  | 'community' | 'parking' | 'playground' | 'other'

export type EquipmentStatus = 'normal' | 'broken' | 'repairing' | 'disposed'
export type MaintenanceType = 'repair' | 'inspection' | 'replacement'
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed'

export interface Facility {
  id: string
  name: string
  location: string | null
  type: FacilityType
  description: string | null
  is_active: boolean
  created_at: string
  equipment?: Equipment[]
}

export interface Equipment {
  id: string
  facility_id: string
  facility?: Facility
  name: string
  model: string | null
  status: EquipmentStatus
  installed_at: string | null
  next_inspection_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  equipment_id: string | null
  equipment?: Equipment
  facility_id: string
  facility?: Facility
  type: MaintenanceType
  title: string
  description: string | null
  status: MaintenanceStatus
  assigned_to: string | null
  assigned_employee?: Employee
  photos: string[]
  cost: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  created_by: string | null
}
