import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { AgentTask, PropertyInspection, TaskStatus, VerificationVisit } from '@/types/agent';
import type { AgentDocument } from '@/types/agent';

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

interface AgentInspectionApi {
  id: string;
  clientName: string | null;
  scheduledAt: string;
  status: 'DRAFT' | 'SUBMITTED';
  type: 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';
  rooms: PropertyInspection['rooms'];
  overallCondition: PropertyInspection['overallCondition'] | null;
  acknowledgedAt: string | null;
  task: { id: string; status: string };
  property: { title: string; address: string; city: string; state: string };
}

interface AgentVerificationApi {
  id: string;
  subjectName: string;
  subjectType: 'TENANT' | 'BUYER' | 'PROPERTY';
  idVerified: boolean;
  addressConfirmed: boolean;
  notes: string | null;
  createdAt: string;
  task: { id: string };
  property: { title: string; address: string };
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
    propertyAddress: property ? `${property.title}, ${property.address}` : 'No property assigned',
    assignedBy: task.assignedBy.legalName || 'GetRentos',
    assignedByRole: role,
    priority: lower(task.priority),
    status: lower(task.status) as TaskStatus,
    dueDate: task.dueAt,
    notes: task.notes || undefined,
  };
}

function mapAgentInspection(inspection: AgentInspectionApi): PropertyInspection {
  return {
    id: inspection.id,
    taskId: inspection.task.id,
    propertyAddress: `${inspection.property.title}, ${inspection.property.address}`,
    clientName: inspection.clientName || 'Property client',
    scheduledDate: inspection.scheduledAt,
    status: inspection.status === 'SUBMITTED' ? 'completed' : 'in_progress',
    type: lower(inspection.type),
    rooms: inspection.rooms,
    overallCondition: inspection.overallCondition || undefined,
    syncStatus: 'synced',
    acknowledgedAt: inspection.acknowledgedAt || undefined,
  };
}

function mapAgentVerification(verification: AgentVerificationApi): VerificationVisit {
  return {
    id: verification.id,
    taskId: verification.task.id,
    subjectName: verification.subjectName,
    subjectType: lower(verification.subjectType),
    address: `${verification.property.title}, ${verification.property.address}`,
    scheduledDate: verification.createdAt,
    status: 'completed',
    idVerified: verification.idVerified,
    addressConfirmed: verification.addressConfirmed,
    notes: verification.notes || '',
    syncStatus: 'synced',
  };
}

export const agentService = {
  listClientAssignments: () => safeCall(() => authFetch('/agent/clients/invitations')),
  listAgentClients: () =>
    safeCall(() =>
      authFetch<Array<{ status: string; client: { id: string; legalName: string } }>>(
        '/agent/clients'
      )
    ),
  startConversation: (clientId: string) =>
    safeCall(() =>
      authFetch<{ id: string }>('/agent/messages', {
        method: 'POST',
        body: JSON.stringify({ clientId }),
      })
    ),
  approveClientAssignment: (id: string) =>
    safeCall(() => authFetch(`/agent/clients/${id}/approve`, { method: 'PATCH' })),
  revokeClientAssignment: (id: string) =>
    safeCall(() => authFetch(`/agent/clients/${id}/revoke`, { method: 'POST' })),
  listAssignableProperties: (id: string) =>
    safeCall(() => authFetch(`/agent/clients/${id}/properties`)),
  assignClientProperty: (id: string, propertyId: string) =>
    safeCall(() =>
      authFetch(`/agent/clients/${id}/properties`, {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      })
    ),
  createClientTask: (data: Record<string, unknown>) =>
    safeCall(() => authFetch('/agent/tasks', { method: 'POST', body: JSON.stringify(data) })),
  getDashboard: (): Promise<ApiResponse<AgentDashboard>> =>
    safeCall(() => authFetch('/agent/dashboard')),
  getProfile: () =>
    safeCall(() =>
      authFetch<{
        trustScore: number;
        isVerified: boolean;
        completedTasks: number;
        reviewAverage: number;
        reviewCount: number;
      }>('/agent/profile')
    ),
  listTasks: async (): Promise<ApiResponse<AgentTask[]>> => {
    const response = await safeCall(() => authFetch<AgentTaskApi[]>('/agent/tasks'));
    if (response.success && response.data) {
      return { ...response, data: response.data.map(mapAgentTask) };
    }
    return { success: false, error: response.error, message: response.message };
  },
  updateTaskStatus: (id: string, status: Uppercase<TaskStatus>) =>
    safeCall(() =>
      authFetch(`/agent/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    ),
  listInspections: async (): Promise<ApiResponse<PropertyInspection[]>> => {
    const response = await safeCall(() => authFetch<AgentInspectionApi[]>('/agent/inspections'));
    if (response.success && response.data) {
      return { ...response, data: response.data.map(mapAgentInspection) };
    }
    return { success: false, error: response.error, message: response.message };
  },
  submitInspection: (data: {
    taskId: string;
    scheduledAt: string;
    type: 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';
    rooms: PropertyInspection['rooms'];
    clientName?: string;
    overallCondition?: string;
  }) =>
    safeCall(() => authFetch('/agent/inspections', { method: 'POST', body: JSON.stringify(data) })),
  listVerifications: async (): Promise<ApiResponse<VerificationVisit[]>> => {
    const response = await safeCall(() =>
      authFetch<AgentVerificationApi[]>('/agent/verifications')
    );
    if (response.success && response.data)
      return { ...response, data: response.data.map(mapAgentVerification) };
    return { success: false, error: response.error, message: response.message };
  },
  submitVerification: (data: {
    taskId: string;
    subjectName: string;
    subjectType: 'TENANT' | 'BUYER' | 'PROPERTY';
    idVerified: boolean;
    addressConfirmed: boolean;
    notes?: string;
  }) =>
    safeCall(() =>
      authFetch('/agent/verifications', { method: 'POST', body: JSON.stringify(data) })
    ),
  listDocuments: async (): Promise<ApiResponse<AgentDocument[]>> => {
    const response = await safeCall(() =>
      authFetch<
        Array<{
          id: string;
          name: string;
          category: string;
          sizeBytes: number;
          createdAt: string;
          property: { title: string } | null;
          task: { title: string } | null;
        }>
      >('/agent/documents')
    );
    if (!response.success || !response.data)
      return { success: false, error: response.error, message: response.message };
    return {
      success: true,
      data: response.data.map((document) => ({
        id: document.id,
        name: document.name,
        category: document.category.toLowerCase() as AgentDocument['category'],
        relatedTo: document.property?.title || document.task?.title,
        uploadedAt: document.createdAt,
        sizeLabel: `${(document.sizeBytes / (1024 * 1024)).toFixed(1)} MB`,
      })),
    };
  },
  uploadDocument: (data: { file: File; name: string; category: string }) => {
    const form = new FormData();
    form.append('file', data.file);
    form.append('name', data.name);
    form.append('category', data.category.toUpperCase());
    return safeCall(() => authFetch('/agent/documents', { method: 'POST', body: form }));
  },
  getDocumentDownload: (id: string) =>
    safeCall(() => authFetch<{ name: string; url: string }>(`/agent/documents/${id}/download`)),
  listConversations: () =>
    safeCall(() =>
      authFetch<
        Array<{
          id: string;
          client: { legalName: string };
          lastMessage: string | null;
          lastMessageAt: string | null;
        }>
      >('/agent/messages')
    ),
  getMessages: (id: string) =>
    safeCall(() =>
      authFetch<
        Array<{ id: string; senderId: string; text: string; createdAt: string; read: boolean }>
      >(`/agent/messages/${id}`)
    ),
  sendMessage: (id: string, text: string, files: File[] = []) => {
    if (!files.length) {
      return safeCall(() =>
        authFetch(`/agent/messages/${id}`, { method: 'POST', body: JSON.stringify({ text }) })
      );
    }
    const form = new FormData();
    form.append('text', text);
    files.forEach((file) => form.append('files', file));
    return safeCall(() => authFetch(`/agent/messages/${id}`, { method: 'POST', body: form }));
  },
};
