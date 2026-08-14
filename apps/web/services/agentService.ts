import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { AgentTask, TaskStatus } from '@/types/agent';

export interface AgentDashboard {
  assignedProperties: number;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingTasks: AgentTaskApi[];
}

interface AgentTaskApi {
  id: string;
  type: 'INSPECTION' | 'VERIFICATION' | 'VALUATION' | 'DOCUMENT_PICKUP';
  title: string;
  notes: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  dueAt: string;
  property: { title: string; address: string; city: string; state: string } | null;
  assignedBy: { legalName: string | null; roles: { role: string }[] };
}

const lower = <T extends string>(value: T) => value.toLowerCase() as Lowercase<T>;

export function mapAgentTask(task: AgentTaskApi): AgentTask {
  const role = task.assignedBy.roles.some(({ role: userRole }) => userRole === 'LANDLORD')
    ? 'landlord'
    : task.assignedBy.roles.some(({ role: userRole }) => userRole === 'PROPERTY_OWNER')
      ? 'owner'
      : 'admin';
  const property = task.property;
  return {
    id: task.id,
    type: lower(task.type),
    title: task.title,
    propertyAddress: property
      ? `${property.title}, ${property.address}`
      : 'No property assigned',
    assignedBy: task.assignedBy.legalName || 'GetRentos',
    assignedByRole: role,
    priority: lower(task.priority),
    status: lower(task.status) as TaskStatus,
    dueDate: task.dueAt,
    notes: task.notes || undefined,
  };
}

export const agentService = {
  getDashboard: (): Promise<ApiResponse<AgentDashboard>> => safeCall(() => authFetch('/agent/dashboard')),
  listTasks: async (): Promise<ApiResponse<AgentTask[]>> => {
    const response = await safeCall(() => authFetch<AgentTaskApi[]>('/agent/tasks'));
    return response.success && response.data
      ? { ...response, data: response.data.map(mapAgentTask) }
      : response;
  },
  updateTaskStatus: (id: string, status: Uppercase<TaskStatus>) =>
    safeCall(() => authFetch(`/agent/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })),
};
