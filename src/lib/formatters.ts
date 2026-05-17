import type {
  DivisionCode,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  ClientStatus,
  UserRole,
  ApprovalStatus,
} from './supabase/types';

export const divisionTone: Record<DivisionCode, 'pink' | 'warning' | 'info' | 'violet' | 'default'> = {
  sales: 'pink',
  marketing: 'warning',
  technology: 'info',
  ecommerce: 'violet',
  admin: 'default',
};

export const taskStatusTone: Record<TaskStatus, 'default' | 'info' | 'warning' | 'success' | 'danger' | 'accent'> = {
  todo: 'default',
  in_progress: 'info',
  blocked: 'warning',
  review_pending: 'accent',
  approved: 'success',
  rejected: 'danger',
  done: 'success',
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  review_pending: 'Review',
  approved: 'Approved',
  rejected: 'Rejected',
  done: 'Done',
};

export const taskBoardColumns: TaskStatus[] = ['todo', 'in_progress', 'review_pending', 'done'];

export const priorityTone: Record<TaskPriority, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

export const projectStatusTone: Record<ProjectStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  planning: 'default',
  active: 'info',
  review: 'warning',
  on_hold: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  review: 'Review',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const clientStatusTone: Record<ClientStatus, 'default' | 'info' | 'success' | 'warning'> = {
  prospect: 'info',
  active: 'success',
  paused: 'warning',
  archived: 'default',
};

export const roleLabel: Record<UserRole, string> = {
  owner: 'Owner',
  executive: 'Executive',
  lead: 'Lead',
  member: 'Member',
  reservist: 'Reservist',
};

export const approvalStatusTone: Record<ApprovalStatus, 'default' | 'success' | 'danger' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};
