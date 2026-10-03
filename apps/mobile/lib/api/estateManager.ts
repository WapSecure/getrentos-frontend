import { apiFetch } from './client';
import type { Paginated } from './properties';

/**
 * The estate office: what a manager runs for a gated community. Scoped to one
 * estate at a time (`/estate/:id/...`); only the estate's own managers may call
 * these, however many estates the account can see.
 *
 * Dashboard stats and the dues trend are Pro (PLAN_UPGRADE_REQUIRED otherwise);
 * everything else here is on every plan.
 */

/* ---------------------------------- types --------------------------------- */

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface ManagedEstate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
  lateFeeAmount: number;
  /** Days a due may run past its due date before it is treated as late. */
  graceDays: number;
  householdCount: number;
  createdAt: string;
  /** The ESTATE'S plan, not the viewer's. Absent means unknown, not free. */
  planTier?: PlanTier;
}

export interface EstateDashboardStats {
  totalHouseholds: number;
  duesCollectedThisMonth: number;
  duesOutstanding: number;
  openIncidents: number;
  openMaintenanceTickets: number;
  pendingViolations: number;
}

export interface EstateDuesPoint {
  label: string;
  value: number;
}

export type HouseholdStatus = 'active' | 'inactive';

export interface Household {
  id: string;
  estateId: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
  status: HouseholdStatus;
  residentUserId?: string;
  /** The resident has a GetRentos account tied to this household. */
  residentLinked: boolean;
  createdAt: string;
}

export type DueStatus = 'pending' | 'paid' | 'overdue' | 'processing' | 'waived';
export type DueCategory = 'rent' | 'service_charge' | 'deposit' | 'levy';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export interface Due {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: DueStatus;
  lateFeeApplied: number;
  category: DueCategory;
  billingCycle: BillingCycle;
  description?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface NewCharge {
  amount: number;
  /** ISO instant. */
  dueDate: string;
  description?: string;
  category: 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY';
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  isRecurring: boolean;
  /** Omit to charge every active household. */
  householdIds?: string[];
}

export type AnnouncementPriority = 'normal' | 'urgent';

export interface Announcement {
  id: string;
  estateId: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  category: 'security' | 'maintenance' | 'safety' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  description: string;
  photoUrl?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'common_area' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  description: string;
  photoUrl?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface Violation {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  category: 'noise' | 'unauthorized_parking' | 'pet_violation' | 'property_maintenance' | 'other';
  description: string;
  status: 'reported' | 'warning_issued' | 'resolved' | 'dismissed';
  warningIssuedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

/* ----------------------------------- api ---------------------------------- */

function q(params: Record<string, string | number | boolean | undefined | null>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : '';
}

export const estateManagerApi = {
  listMine: () => apiFetch<ManagedEstate[]>('/estate/mine'),
  dashboard: (estateId: string) =>
    apiFetch<EstateDashboardStats>(`/estate/${estateId}/dashboard/stats`),
  duesTrend: (estateId: string) =>
    apiFetch<EstateDuesPoint[]>(`/estate/${estateId}/dashboard/dues-trend`),
  updateDueSettings: (estateId: string, body: { lateFeeAmount: number; graceDays?: number }) =>
    apiFetch<ManagedEstate>(`/estate/${estateId}/due-settings`, { method: 'PATCH', body }),

  households: (
    estateId: string,
    opts: { page?: number; search?: string; status?: 'ACTIVE' | 'INACTIVE' } = {}
  ) =>
    apiFetch<Paginated<Household>>(
      `/estate/${estateId}/households${q({ page: opts.page ?? 1, pageSize: 30, search: opts.search, status: opts.status })}`
    ),
  household: (estateId: string, householdId: string) =>
    apiFetch<Household>(`/estate/${estateId}/households/${householdId}`),
  addHousehold: (
    estateId: string,
    body: { unitLabel: string; residentName: string; contactPhone?: string; contactEmail?: string }
  ) => apiFetch<Household>(`/estate/${estateId}/households`, { method: 'POST', body }),
  updateHousehold: (
    estateId: string,
    householdId: string,
    body: Partial<{
      unitLabel: string;
      residentName: string;
      contactPhone: string;
      contactEmail: string;
      status: 'ACTIVE' | 'INACTIVE';
    }>
  ) =>
    apiFetch<Household>(`/estate/${estateId}/households/${householdId}`, { method: 'PATCH', body }),
  removeHousehold: (estateId: string, householdId: string) =>
    apiFetch<void>(`/estate/${estateId}/households/${householdId}`, { method: 'DELETE' }),
  linkResident: (estateId: string, householdId: string, email: string) =>
    apiFetch<Household>(`/estate/${estateId}/households/${householdId}/resident`, {
      method: 'POST',
      body: { email },
    }),
  unlinkResident: (estateId: string, householdId: string) =>
    apiFetch<Household>(`/estate/${estateId}/households/${householdId}/resident`, {
      method: 'DELETE',
    }),

  dues: (
    estateId: string,
    opts: {
      page?: number;
      pageSize?: number;
      status?: 'PENDING' | 'PAID' | 'OVERDUE';
      householdId?: string;
    } = {}
  ) =>
    apiFetch<Paginated<Due>>(
      `/estate/${estateId}/dues${q({ page: opts.page ?? 1, pageSize: opts.pageSize ?? 30, status: opts.status, householdId: opts.householdId })}`
    ),
  charge: (estateId: string, body: NewCharge) =>
    apiFetch<{ created: number }>(`/estate/${estateId}/dues`, { method: 'POST', body }),
  markDuePaid: (estateId: string, dueId: string) =>
    apiFetch<Due>(`/estate/${estateId}/dues/${dueId}/pay`, { method: 'PATCH' }),

  announcements: (estateId: string, page = 1) =>
    apiFetch<Paginated<Announcement>>(
      `/estate/${estateId}/announcements${q({ page, pageSize: 30 })}`
    ),
  announce: (
    estateId: string,
    body: {
      title: string;
      body: string;
      priority: 'NORMAL' | 'URGENT';
      deliveryChannels?: ('SMS' | 'WHATSAPP')[];
    }
  ) => apiFetch<Announcement>(`/estate/${estateId}/announcements`, { method: 'POST', body }),
  updateAnnouncement: (
    estateId: string,
    id: string,
    body: Partial<{ title: string; body: string; priority: 'NORMAL' | 'URGENT' }>
  ) => apiFetch<Announcement>(`/estate/${estateId}/announcements/${id}`, { method: 'PATCH', body }),
  removeAnnouncement: (estateId: string, id: string) =>
    apiFetch<void>(`/estate/${estateId}/announcements/${id}`, { method: 'DELETE' }),

  incidents: (estateId: string, status?: string) =>
    apiFetch<Incident[]>(`/estate/${estateId}/incidents${q({ status })}`),
  maintenance: (estateId: string, status?: string) =>
    apiFetch<MaintenanceTicket[]>(`/estate/${estateId}/maintenance${q({ status })}`),
  violations: (estateId: string, status?: string) =>
    apiFetch<Violation[]>(`/estate/${estateId}/violations${q({ status })}`),
};

/* --------------------------------- helpers -------------------------------- */

/** The estate to open: the one last chosen if it's still theirs, else the first. */
export function pickEstate<T extends { id: string }>(
  estates: T[] | undefined,
  storedId: string | null | undefined
): T | undefined {
  if (!estates?.length) return undefined;
  return estates.find((e) => e.id === storedId) ?? estates[0];
}

/** Analytics the estate hasn't paid for. Unknown is treated as paid: see `planTier`. */
export const isFreeEstate = (e?: Pick<ManagedEstate, 'planTier'>) => e?.planTier === 'FREE';

export type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';

export const DUE_STATUS: Record<DueStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Due', tone: 'info' },
  overdue: { label: 'Overdue', tone: 'danger' },
  processing: { label: 'Paying online', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  waived: { label: 'Waived', tone: 'neutral' },
};

export const DUE_CATEGORIES: { value: NewCharge['category']; label: string }[] = [
  { value: 'SERVICE_CHARGE', label: 'Service charge' },
  { value: 'LEVY', label: 'Levy' },
  { value: 'RENT', label: 'Rent' },
  { value: 'DEPOSIT', label: 'Deposit' },
];
export const dueCategoryLabel = (c: string) =>
  DUE_CATEGORIES.find((x) => x.value === c.toUpperCase())?.label ?? 'Charge';

export const BILLING_CYCLES: { value: NewCharge['billingCycle']; label: string; every: string }[] =
  [
    { value: 'MONTHLY', label: 'Monthly', every: 'every month' },
    { value: 'QUARTERLY', label: 'Quarterly', every: 'every quarter' },
    { value: 'ANNUAL', label: 'Yearly', every: 'every year' },
  ];

/** What a due costs today: the charge plus any late fee already applied. */
export const dueTotal = (d: Pick<Due, 'amount' | 'lateFeeApplied'>) =>
  d.amount + (d.lateFeeApplied || 0);

export const isDueOpen = (d: Pick<Due, 'status'>) =>
  d.status === 'pending' || d.status === 'overdue' || d.status === 'processing';

/** "3 days overdue", "Due today", "Due in 5 days": a due against today's date. */
export function dueWhen(d: Pick<Due, 'dueDate' | 'status' | 'paidDate'>, now = new Date()): string {
  if (d.status === 'paid') return 'Paid';
  if (d.status === 'waived') return 'Waived';
  const day = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round((day(new Date(d.dueDate)) - day(now)) / 86_400_000);
  if (days === 0) return 'Due today';
  if (days > 0) return `Due in ${days} day${days === 1 ? '' : 's'}`;
  return `${-days} day${days === -1 ? '' : 's'} overdue`;
}

/**
 * What a household owes across the dues given: the open total and how much of
 * it is overdue. Paid and waived dues owe nothing.
 */
export function owed(dues: Pick<Due, 'amount' | 'lateFeeApplied' | 'status'>[]): {
  total: number;
  overdue: number;
  count: number;
} {
  let total = 0;
  let overdue = 0;
  let count = 0;
  for (const d of dues) {
    if (!isDueOpen(d)) continue;
    count += 1;
    total += dueTotal(d);
    if (d.status === 'overdue') overdue += dueTotal(d);
  }
  return { total, overdue, count };
}

/** Who a new charge reaches, in words, so the manager confirms the right thing. */
export function chargeAudience(selected: number, activeHouseholds: number): string {
  if (!selected) return `Every active household (${activeHouseholds.toLocaleString('en-NG')})`;
  return `${selected} selected household${selected === 1 ? '' : 's'}`;
}
