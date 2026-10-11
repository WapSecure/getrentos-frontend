import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { BillingCycle } from '@/services/landlordService';

export type BroadcastAudience = 'ALL_TENANTS' | 'PROPERTY' | 'IN_ARREARS';

export interface AnnouncementTemplate {
  id: string;
  title: string;
  content: string;
  category?: string;
  useCount: number;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  landlordId: string;
  name: string;
  audience: BroadcastAudience;
  propertyId: string | null;
  title: string;
  body: string;
  cadence: BillingCycle;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  lastRecipientCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastInput {
  audience: BroadcastAudience;
  propertyId?: string;
  title: string;
  body: string;
}

export interface CreateRuleInput {
  name: string;
  audience: BroadcastAudience;
  propertyId?: string;
  title: string;
  body: string;
  cadence: BillingCycle;
  firstRunAt: string;
  enabled?: boolean;
}

export const automationService = {
  // --- broadcast ---
  broadcast(input: BroadcastInput): Promise<ApiResponse<{ recipientCount: number }>> {
    return safeCall(() =>
      authFetch('/landlord/announcements/broadcast', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  // --- templates ---
  listTemplates(): Promise<ApiResponse<AnnouncementTemplate[]>> {
    return safeCall(() => authFetch('/landlord/announcements/templates'));
  },
  createTemplate(input: {
    title: string;
    content: string;
    category?: string;
  }): Promise<ApiResponse<AnnouncementTemplate>> {
    return safeCall(() =>
      authFetch('/landlord/announcements/templates', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },
  updateTemplate(
    id: string,
    input: { title?: string; content?: string; category?: string }
  ): Promise<ApiResponse<AnnouncementTemplate>> {
    return safeCall(() =>
      authFetch(`/landlord/announcements/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    );
  },
  deleteTemplate(id: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/landlord/announcements/templates/${id}`, { method: 'DELETE' })
    );
  },

  // --- rules ---
  listRules(): Promise<ApiResponse<AutomationRule[]>> {
    return safeCall(() => authFetch('/landlord/automation-rules'));
  },
  createRule(input: CreateRuleInput): Promise<ApiResponse<AutomationRule>> {
    return safeCall(() =>
      authFetch('/landlord/automation-rules', { method: 'POST', body: JSON.stringify(input) })
    );
  },
  updateRule(id: string, input: Partial<CreateRuleInput>): Promise<ApiResponse<AutomationRule>> {
    return safeCall(() =>
      authFetch(`/landlord/automation-rules/${id}`, { method: 'PUT', body: JSON.stringify(input) })
    );
  },
  deleteRule(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/landlord/automation-rules/${id}`, { method: 'DELETE' }));
  },
  runRule(id: string): Promise<ApiResponse<{ recipientCount: number }>> {
    return safeCall(() => authFetch(`/landlord/automation-rules/${id}/run`, { method: 'POST' }));
  },
};
