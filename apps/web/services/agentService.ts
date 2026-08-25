import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { Paginated } from '@/lib/apiHelpers';
import type {
  AgentTask,
  PropertyInspection,
  TaskStatus,
  VerificationVisit,
  AgentReview,
  OfflineSyncItem,
} from '@/types/agent';
import type { AgentDocument } from '@/types/agent';
import type { TrustProfile } from '@/types/trust-score';

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

interface AgentDocumentApi {
  id: string;
  name: string;
  category: string;
  sizeBytes: number;
  createdAt: string;
  property: { title: string } | null;
  task: { title: string } | null;
}

export interface AgentPageOptions {
  page?: number;
  pageSize?: number;
}

export interface AgentTaskListOptions extends AgentPageOptions {
  status?: TaskStatus;
  type?: AgentTask['type'];
  search?: string;
}

export interface AgentInspectionListOptions extends AgentPageOptions {
  status?: 'draft' | 'submitted';
  search?: string;
}

export interface AgentVerificationListOptions extends AgentPageOptions {
  subjectType?: VerificationVisit['subjectType'];
  search?: string;
}

export interface AgentDocumentListOptions extends AgentPageOptions {
  category?: AgentDocument['category'];
  search?: string;
}

export interface AgentConversationListOptions extends AgentPageOptions {
  search?: string;
}

export interface AgentClientListOptions extends AgentPageOptions {
  status?: 'pending' | 'active' | 'revoked';
}

export interface AgentClientAssignment {
  id: string;
  status: string;
  agent?: { id: string; legalName: string; email: string; companyName?: string | null };
  client?: { id: string; legalName: string; email?: string; phone?: string | null };
}

export interface AgentAssignableProperty {
  id: string;
  title: string;
  city: string;
  state: string;
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
  listClientAssignments: (options: AgentClientListOptions = {}) =>
    safeCall(() =>
      authFetch<Paginated<AgentClientAssignment>>(
        `/agent/clients/invitations${toQuery({
          ...options,
          status: options.status?.toUpperCase(),
        })}`
      )
    ),
  listAgentClients: (options: AgentClientListOptions = {}) =>
    safeCall(() =>
      authFetch<Paginated<AgentClientAssignment>>(
        `/agent/clients${toQuery({ ...options, status: options.status?.toUpperCase() })}`
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
  listAssignableProperties: (id: string, options: AgentPageOptions & { search?: string } = {}) =>
    safeCall(() =>
      authFetch<Paginated<AgentAssignableProperty>>(
        `/agent/clients/${id}/properties${toQuery({
          page: options.page,
          pageSize: options.pageSize,
          search: options.search,
        })}`
      )
    ),
  listProperties: (options: AgentPageOptions & { search?: string } = {}) =>
    safeCall(() =>
      authFetch(
        `/agent/properties${toQuery({
          page: options.page,
          pageSize: options.pageSize,
          search: options.search,
        })}`
      )
    ),
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
  getTrustProfile: () => safeCall(() => authFetch<TrustProfile>('/agent/trust-profile')),
  getReviews: (options: AgentPageOptions = {}) =>
    safeCall(() =>
      authFetch<Paginated<AgentReview>>(
        `/agent/reviews${toQuery({ page: options.page, pageSize: options.pageSize })}`
      )
    ),
  getReviewsSummary: () =>
    safeCall(() =>
      authFetch<{
        averageRating: number;
        reviewCount: number;
        ratingDistribution: Array<{ rating: number; count: number }>;
      }>('/agent/reviews/summary')
    ),
  getSyncItems: () => safeCall(() => authFetch<OfflineSyncItem[]>('/agent/sync')),
  listTasks: async (
    options: AgentTaskListOptions = {}
  ): Promise<ApiResponse<Paginated<AgentTask>>> => {
    const response = await safeCall(() =>
      authFetch<Paginated<AgentTaskApi>>(
        `/agent/tasks${toQuery({
          ...options,
          status: options.status?.toUpperCase(),
          type: options.type?.toUpperCase(),
        })}`
      )
    );
    if (response.success && response.data) {
      return {
        ...response,
        data: { ...response.data, items: response.data.items.map(mapAgentTask) },
      };
    }
    return { success: false, error: response.error, message: response.message };
  },
  updateTaskStatus: (id: string, status: Uppercase<TaskStatus>) =>
    safeCall(() =>
      authFetch(`/agent/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    ),
  listInspections: async (
    options: AgentInspectionListOptions = {}
  ): Promise<ApiResponse<Paginated<PropertyInspection>>> => {
    const response = await safeCall(() =>
      authFetch<Paginated<AgentInspectionApi>>(
        `/agent/inspections${toQuery({
          ...options,
          status: options.status?.toUpperCase(),
        })}`
      )
    );
    if (response.success && response.data) {
      return {
        ...response,
        data: { ...response.data, items: response.data.items.map(mapAgentInspection) },
      };
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
  listVerifications: async (
    options: AgentVerificationListOptions = {}
  ): Promise<ApiResponse<Paginated<VerificationVisit>>> => {
    const response = await safeCall(() =>
      authFetch<Paginated<AgentVerificationApi>>(
        `/agent/verifications${toQuery({
          ...options,
          subjectType: options.subjectType?.toUpperCase(),
        })}`
      )
    );
    if (response.success && response.data) {
      return {
        ...response,
        data: { ...response.data, items: response.data.items.map(mapAgentVerification) },
      };
    }
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
  listDocuments: async (
    options: AgentDocumentListOptions = {}
  ): Promise<ApiResponse<Paginated<AgentDocument>>> => {
    const response = await safeCall(() =>
      authFetch<Paginated<AgentDocumentApi>>(
        `/agent/documents${toQuery({
          ...options,
          category: options.category?.toUpperCase(),
        })}`
      )
    );
    if (!response.success || !response.data)
      return { success: false, error: response.error, message: response.message };
    return {
      success: true,
      data: {
        ...response.data,
        items: response.data.items.map((document) => ({
          id: document.id,
          name: document.name,
          category: document.category.toLowerCase() as AgentDocument['category'],
          relatedTo: document.property?.title || document.task?.title,
          uploadedAt: document.createdAt,
          sizeLabel: `${(document.sizeBytes / (1024 * 1024)).toFixed(1)} MB`,
        })),
      },
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
  listConversations: (options: AgentConversationListOptions = {}) =>
    safeCall(() =>
      authFetch<
        Paginated<{
          id: string;
          client: { legalName: string };
          lastMessage: string | null;
          lastMessageAt: string | null;
        }>
      >(
        `/agent/messages${toQuery({
          page: options.page,
          pageSize: options.pageSize,
          search: options.search,
        })}`
      )
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
