import { apiFetch } from './client';

/**
 * Landlord automations (Pro): a one-off broadcast to tenants, saved message
 * templates, and rules that send on a schedule or when a tenancy event happens.
 */

export type BroadcastAudience = 'ALL_TENANTS' | 'PROPERTY' | 'IN_ARREARS';
export type AutomationTrigger = 'SCHEDULE' | 'RENT_DUE_SOON' | 'RENT_OVERDUE' | 'LEASE_EXPIRING';
export type Cadence = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

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
  name: string;
  trigger: AutomationTrigger;
  audience: BroadcastAudience | null;
  propertyId: string | null;
  title: string;
  body: string;
  cadence: Cadence | null;
  enabled: boolean;
  nextRunAt: string | null;
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

export interface RuleInput {
  name: string;
  trigger?: AutomationTrigger;
  audience?: BroadcastAudience;
  propertyId?: string;
  title: string;
  body: string;
  cadence?: Cadence;
  firstRunAt?: string;
  enabled?: boolean;
}

export const TRIGGERS: { value: AutomationTrigger; label: string }[] = [
  { value: 'SCHEDULE', label: 'On a schedule' },
  { value: 'RENT_DUE_SOON', label: 'Rent due soon' },
  { value: 'RENT_OVERDUE', label: 'Rent overdue' },
  { value: 'LEASE_EXPIRING', label: 'Lease expiring' },
];
export const TRIGGER_LABEL = Object.fromEntries(TRIGGERS.map((t) => [t.value, t.label])) as Record<
  AutomationTrigger,
  string
>;
TRIGGER_LABEL.SCHEDULE = 'Scheduled';

export const AUDIENCES: { value: BroadcastAudience; label: string }[] = [
  { value: 'ALL_TENANTS', label: 'All tenants' },
  { value: 'PROPERTY', label: 'One property' },
  { value: 'IN_ARREARS', label: 'In arrears' },
];
export const AUDIENCE_LABEL = Object.fromEntries(
  AUDIENCES.map((a) => [a.value, a.label])
) as Record<BroadcastAudience, string>;

export const CADENCES: { value: Cadence; label: string }[] = [
  { value: 'MONTHLY', label: 'Every month' },
  { value: 'QUARTERLY', label: 'Every quarter' },
  { value: 'ANNUAL', label: 'Every year' },
];
export const CADENCE_LABEL: Record<Cadence, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
};

/** Merge fields the server fills in per recipient. */
export const MERGE_FIELDS = ['{{tenant_name}}', '{{property}}'];

export interface RuleForm {
  name: string;
  trigger: AutomationTrigger;
  audience: BroadcastAudience;
  propertyId: string;
  title: string;
  body: string;
  cadence: Cadence;
  /** `yyyy-MM-dd` */
  firstRunAt: string;
  enabled: boolean;
}

export const EMPTY_RULE: RuleForm = {
  name: '',
  trigger: 'SCHEDULE',
  audience: 'ALL_TENANTS',
  propertyId: '',
  title: '',
  body: '',
  cadence: 'MONTHLY',
  firstRunAt: '',
  enabled: true,
};

export const ruleToForm = (r: AutomationRule): RuleForm => ({
  name: r.name,
  trigger: r.trigger,
  audience: r.audience ?? 'ALL_TENANTS',
  propertyId: r.propertyId ?? '',
  title: r.title,
  body: r.body,
  cadence: r.cadence ?? 'MONTHLY',
  firstRunAt: r.nextRunAt ? r.nextRunAt.slice(0, 10) : '',
  enabled: r.enabled,
});

/**
 * What the server takes. A scheduled rule broadcasts to an audience on a
 * cadence; an event rule messages the tenant the event is about, optionally
 * only on one property.
 */
export function rulePayload(f: RuleForm, editing = false): RuleInput {
  const full = buildRule(f);
  if (!editing) return full;
  // The trigger is fixed once a rule exists: the API refuses it on an edit.
  const { trigger: _trigger, ...rest } = full;
  return rest;
}

function buildRule(f: RuleForm): RuleInput {
  const common = {
    name: f.name.trim(),
    title: f.title.trim(),
    body: f.body.trim(),
    enabled: f.enabled,
  };
  if (f.trigger === 'SCHEDULE') {
    return {
      ...common,
      trigger: 'SCHEDULE',
      audience: f.audience,
      ...(f.audience === 'PROPERTY' ? { propertyId: f.propertyId } : {}),
      cadence: f.cadence,
      firstRunAt: f.firstRunAt,
    };
  }
  return { ...common, trigger: f.trigger, ...(f.propertyId ? { propertyId: f.propertyId } : {}) };
}

/** What still stops the rule being saved, or null. */
export function ruleBlocker(f: RuleForm): string | null {
  if (!f.name.trim()) return 'Name the rule.';
  if (f.trigger === 'SCHEDULE') {
    if (f.audience === 'PROPERTY' && !f.propertyId) return 'Choose the property.';
    if (!f.firstRunAt) return 'Choose when it first sends.';
  }
  if (!f.title.trim() || !f.body.trim()) return 'Write the title and the message.';
  return null;
}

/** What still stops a broadcast going, or null. */
export function broadcastBlocker(b: BroadcastInput): string | null {
  if (b.audience === 'PROPERTY' && !b.propertyId) return 'Choose the property.';
  if (!b.title.trim() || !b.body.trim()) return 'Write the title and the message.';
  return null;
}

export const recipients = (n: number) => `${n} tenant${n === 1 ? '' : 's'}`;

export const automationsApi = {
  broadcast: (input: BroadcastInput) =>
    apiFetch<{ recipientCount: number }>('/landlord/announcements/broadcast', {
      method: 'POST',
      body: input,
    }),
  templates: () => apiFetch<AnnouncementTemplate[]>('/landlord/announcements/templates'),
  createTemplate: (input: { title: string; content: string }) =>
    apiFetch<AnnouncementTemplate>('/landlord/announcements/templates', {
      method: 'POST',
      body: input,
    }),
  updateTemplate: (id: string, input: { title: string; content: string }) =>
    apiFetch<AnnouncementTemplate>(`/landlord/announcements/templates/${id}`, {
      method: 'PATCH',
      body: input,
    }),
  deleteTemplate: (id: string) =>
    apiFetch<void>(`/landlord/announcements/templates/${id}`, { method: 'DELETE' }),
  rules: () => apiFetch<AutomationRule[]>('/landlord/automation-rules'),
  createRule: (input: RuleInput) =>
    apiFetch<AutomationRule>('/landlord/automation-rules', { method: 'POST', body: input }),
  updateRule: (id: string, input: Partial<RuleInput>) =>
    apiFetch<AutomationRule>(`/landlord/automation-rules/${id}`, { method: 'PUT', body: input }),
  deleteRule: (id: string) =>
    apiFetch<void>(`/landlord/automation-rules/${id}`, { method: 'DELETE' }),
  runRule: (id: string) =>
    apiFetch<{ recipientCount: number }>(`/landlord/automation-rules/${id}/run`, {
      method: 'POST',
    }),
};
