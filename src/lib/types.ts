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
