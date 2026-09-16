import { apiFetch } from './client';
import type { Paginated } from './properties';

export const AGENT_TASK_TYPES = [
  'INSPECTION',
  'VERIFICATION',
  'VALUATION',
  'DOCUMENT_PICKUP',
] as const;
export type AgentTaskType = (typeof AGENT_TASK_TYPES)[number];

export const AGENT_TASK_TYPE_LABEL: Record<AgentTaskType, string> = {
  INSPECTION: 'Inspection',
  VERIFICATION: 'Verification',
  VALUATION: 'Valuation',
  DOCUMENT_PICKUP: 'Document pickup',
};

export const AGENT_TASK_STATUSES = [
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
] as const;
export type AgentTaskStatus = (typeof AGENT_TASK_STATUSES)[number];

export const AGENT_TASK_STATUS_LABEL: Record<AgentTaskStatus, string> = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const AGENT_TASK_STATUS_TONE: Record<
  AgentTaskStatus,
  'info' | 'warning' | 'success' | 'danger' | 'neutral'
> = {
  ASSIGNED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

export type AgentTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgentTaskProperty {
  /** Present on `agentApi.tasks()` items; omitted on `agentApi.dashboard()`'s `upcomingTasks`. */
  id?: string;
  title: string;
  address: string;
  city: string;
  state: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  assignedById: string;
  agentClientId: string;
  propertyId: string;
  type: AgentTaskType;
  title: string;
  notes?: string | null;
  priority: AgentTaskPriority;
  status: AgentTaskStatus;
  dueAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  property: AgentTaskProperty;
  assignedBy: { id: string; legalName: string; roles: { role: string }[] };
}

export interface AgentDashboard {
  assignedProperties: number;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingTasks: AgentTask[];
}

export interface AgentVerificationItem {
  id: string;
  label: string;
  verified: boolean;
  date?: string;
  description: string;
  icon: string;
}

export interface AgentProfile {
  id: string;
  legalName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  trustScore: number;
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
  completedTasks: number;
  reviewAverage: number;
  reviewCount: number;
  reviews: {
    id: string;
    rating: number;
    category: string;
    comment?: string | null;
    createdAt: string;
    reviewer: { legalName: string };
  }[];
  verifications: AgentVerificationItem[];
}

export interface AgentAssignedProperty {
  id: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    propertyType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    coverImageKey?: string | null;
    isVerified: boolean;
  };
  agentClient: {
    client: { id: string; legalName: string; email: string; phone?: string | null };
  };
}

export type RoomCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface AgentInspectionRoom {
  room: string;
  condition: RoomCondition;
  notes?: string;
  photoCount?: number;
}

export type AgentInspectionType = 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';

export interface AgentInspection {
  id: string;
  taskId: string;
  agentId: string;
  propertyId: string;
  scheduledAt: string;
  type: AgentInspectionType;
  rooms: AgentInspectionRoom[];
  clientName?: string | null;
  overallCondition?: string | null;
  status: 'DRAFT' | 'SUBMITTED';
  submittedAt?: string | null;
  createdAt: string;
  /** Present on `agentApi.inspections()` items; omitted on `submitInspection()`'s response. */
  task?: { id: string; title: string; status: AgentTaskStatus };
  property?: AgentTaskProperty;
}

export interface SubmitInspectionInput {
  taskId: string;
  scheduledAt: string;
  type: AgentInspectionType;
  rooms: AgentInspectionRoom[];
  clientName?: string;
  overallCondition?: string;
}

export type AgentVerificationSubjectType = 'TENANT' | 'BUYER' | 'PROPERTY';

export interface AgentVerification {
  id: string;
  taskId: string;
  agentId: string;
  propertyId: string;
  subjectName: string;
  subjectType: AgentVerificationSubjectType;
  idVerified: boolean;
  addressConfirmed: boolean;
  notes?: string | null;
  /** The schema models a single terminal state — a verification exists only once submitted. */
  status: 'SUBMITTED';
  submittedAt?: string | null;
  createdAt: string;
  task: { id: string };
  property: { title: string; address: string };
}

export interface SubmitVerificationInput {
  taskId: string;
  subjectName: string;
  subjectType: AgentVerificationSubjectType;
  idVerified: boolean;
  addressConfirmed: boolean;
  notes?: string;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const agentApi = {
  dashboard: () => apiFetch<AgentDashboard>('/agent/dashboard'),

  profile: () => apiFetch<AgentProfile>('/agent/profile'),

  properties: (page = 1, pageSize = 20, search?: string) =>
    apiFetch<Paginated<AgentAssignedProperty>>(
      `/agent/properties${toQuery({ page, pageSize, search })}`
    ),

  tasks: (
    page = 1,
    pageSize = 20,
    opts?: { status?: AgentTaskStatus; type?: AgentTaskType; search?: string }
  ) =>
    apiFetch<Paginated<AgentTask>>(
      `/agent/tasks${toQuery({ page, pageSize, status: opts?.status, type: opts?.type, search: opts?.search })}`
    ),

  updateTaskStatus: (id: string, status: AgentTaskStatus) =>
    apiFetch<AgentTask>(`/agent/tasks/${id}`, { method: 'PATCH', body: { status } }),

  inspections: (
    page = 1,
    pageSize = 20,
    opts?: { status?: 'DRAFT' | 'SUBMITTED'; search?: string }
  ) =>
    apiFetch<Paginated<AgentInspection>>(
      `/agent/inspections${toQuery({ page, pageSize, status: opts?.status, search: opts?.search })}`
    ),

  submitInspection: (input: SubmitInspectionInput) =>
    apiFetch<AgentInspection>('/agent/inspections', { method: 'POST', body: input }),

  verifications: (
    page = 1,
    pageSize = 20,
    opts?: { subjectType?: AgentVerificationSubjectType; search?: string }
  ) =>
    apiFetch<Paginated<AgentVerification>>(
      `/agent/verifications${toQuery({ page, pageSize, subjectType: opts?.subjectType, search: opts?.search })}`
    ),

  submitVerification: (input: SubmitVerificationInput) =>
    apiFetch<AgentVerification>('/agent/verifications', { method: 'POST', body: input }),
};
