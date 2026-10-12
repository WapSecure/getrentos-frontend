import type { AutomationTrigger, BroadcastAudience } from '@/services/automationService';
import type { BillingCycle } from '@/services/landlordService';

export const TRIGGER_OPTIONS: { value: AutomationTrigger; label: string }[] = [
  { value: 'SCHEDULE', label: 'On a schedule' },
  { value: 'RENT_DUE_SOON', label: "When a tenant's rent is due soon" },
  { value: 'RENT_OVERDUE', label: "When a tenant's rent goes overdue" },
  { value: 'LEASE_EXPIRING', label: "When a tenant's lease is expiring" },
];

export const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  SCHEDULE: 'Scheduled',
  RENT_DUE_SOON: 'Rent due soon',
  RENT_OVERDUE: 'Rent overdue',
  LEASE_EXPIRING: 'Lease expiring',
};

export const AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string }[] = [
  { value: 'ALL_TENANTS', label: 'All tenants' },
  { value: 'PROPERTY', label: 'Tenants of one property' },
  { value: 'IN_ARREARS', label: 'Tenants in arrears' },
];

export const AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  ALL_TENANTS: 'All tenants',
  PROPERTY: 'One property',
  IN_ARREARS: 'In arrears',
};

export const CADENCE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'MONTHLY', label: 'Every month' },
  { value: 'QUARTERLY', label: 'Every quarter' },
  { value: 'ANNUAL', label: 'Every year' },
];

export const CADENCE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
};

/** Merge fields the backend renders per recipient. */
export const MERGE_FIELDS = ['{{tenant_name}}', '{{property}}'];
