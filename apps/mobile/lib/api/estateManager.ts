import type { ReplyLanguage } from '../replyLanguage';
import { contactBody } from '@/lib/contact';
import { apiFetch, apiFetchOrNull, apiUpload } from './client';
import { toQuery } from './query';
import { appendFile, type PickedFile } from './documents';
import type { VisitorPass } from './visitor-pass';
import type { Paginated } from './properties';

/** Only the estate's own managers may call these. Dashboard stats and the dues trend are Pro (PLAN_UPGRADE_REQUIRED otherwise). */

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

export interface IssuedVisitorPass extends VisitorPass {
  pin: string;
  /** The pin as a scannable QR code (data:image/png;base64,...). */
  qrDataUrl: string;
}

/** `BLOCK` refuses entry. `WATCH` admits the visitor but tells the office. */
export type WatchlistSeverity = 'BLOCK' | 'WATCH';
export type WatchlistSubjectType = 'PERSON' | 'VEHICLE';

export interface WatchlistEntry {
  id: string;
  subjectType: WatchlistSubjectType;
  severity: WatchlistSeverity;
  /** Lifted entries stay on the list as a record of who decided what. */
  status: 'ACTIVE' | 'LIFTED';
  label: string;
  phone?: string;
  plateNumber?: string;
  reason: string;
  photoUrl?: string;
  expiresAt?: string;
  liftedAt?: string;
  liftReason?: string;
  createdAt: string;
}

export type EmergencyKind = 'FIRE' | 'GAS_LEAK' | 'STRUCTURAL' | 'SECURITY' | 'MEDICAL' | 'OTHER';
export type MusterRollState = 'UNACCOUNTED' | 'ACCOUNTED' | 'NOT_ON_SITE' | 'NEEDS_HELP';

export interface MusterRollEntry {
  id: string;
  householdId: string;
  unitLabel: string;
  personName: string;
  basis: 'RESIDENT' | 'ON_SITE';
  basisLabel: string;
  state: MusterRollState;
  stateLabel: string;
  stateAt?: string | null;
  stateNote?: string | null;
}

/** Counted server-side so every screen and message prints the same figures. */
export interface MusterTally {
  total: number;
  accountedFor: number;
  notOnSite: number;
  needsHelp: number;
  unaccounted: number;
  settled: boolean;
}

export interface MusterSummary {
  id: string;
  kind: EmergencyKind;
  kindLabel: string;
  description: string;
  status: 'ACTIVE' | 'CLOSED' | 'TIMED_OUT';
  statusLabel: string;
  declaredAt: string;
  closedAt?: string | null;
  tally: MusterTally;
  tallyLabel: string;
}

export interface EmergencyMuster extends MusterSummary {
  assemblyPoint?: string | null;
  /** What residents were told to do, composed server-side. */
  assemblyInstruction: string;
  closingNote?: string | null;
  /** False once closed or timed out. */
  rollOpen: boolean;
  roll: MusterRollEntry[];
}

export interface PollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  question: string;
  status: 'open' | 'closed';
  options: PollOption[];
  /** One vote per household. */
  totalVotes: number;
  createdAt: string;
}

export interface Amenity {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  startsAt: string;
  endsAt: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

/** Row numbers are the spreadsheet's own lines. */
export interface CsvImportResult {
  created: number;
  failed: number;
  errors: { row: number; unitLabel?: string; visitorName?: string; message: string }[];
}

export interface GuestListImportResult extends CsvImportResult {
  label: string;
  expiresAt: string;
  deadlineLabel: string;
}

export const HOUSEHOLDS_CSV_TEMPLATE =
  'unitLabel,residentName,contactPhone,contactEmail\n' +
  'Block A Plot 1,Chidi Okoro,08012345678,chidi@example.com\n';

export const GUEST_LIST_CSV_TEMPLATE = 'name,phone,purpose\nAda Obi,08012345678,Birthday party\n';

export function importSummary(r: CsvImportResult, noun: [string, string]): string {
  const n = `${r.created} ${r.created === 1 ? noun[0] : noun[1]} imported`;
  return r.failed > 0 ? `${n}, ${r.failed} failed` : n;
}

export function deadlineIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const at = new Date(`${date}T${time}:00`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

export interface ReportGroup {
  title: string;
  summary: string;
  action: string;
  reports: number;
  households: number;
  oldestDays: number;
  priority: string;
  line: string;
  items: {
    id: string;
    kind: 'incident' | 'ticket';
    description: string;
    unit: string | null;
    ageDays: number;
  }[];
}

export interface ReportDigest {
  overview: string;
  groups: ReportGroup[];
  ungrouped: number;
  total: number;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export interface AnnouncementDraft {
  title: string;
  body: string;
  priority: 'NORMAL' | 'URGENT';
  language: ReplyLanguage;
}

export interface PollDraft {
  question: string;
  options: string[];
}

export const estateManagerApi = {
  importHouseholds: (estateId: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<CsvImportResult>(`/estate/${estateId}/households/import`, form);
  },
  /** Enterprise. Each guest is screened like a single invitation. */
  importGuestList: (
    estateId: string,
    input: { householdId: string; expiresAt: string; file: PickedFile }
  ) => {
    const form = new FormData();
    form.append('householdId', input.householdId);
    form.append('expiresAt', input.expiresAt);
    appendFile(form, 'file', input.file);
    return apiUpload<GuestListImportResult>(`/estate/${estateId}/expected-visitors/import`, form);
  },
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
      `/estate/${estateId}/households${toQuery({ page: opts.page ?? 1, pageSize: 30, search: opts.search, status: opts.status })}`
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
  /** By the resident's phone number or email on Sureground. */
  linkResident: (estateId: string, householdId: string, contact: string) =>
    apiFetch<Household>(`/estate/${estateId}/households/${householdId}/resident`, {
      method: 'POST',
      body: contactBody(contact),
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
      status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'PROCESSING';
      householdId?: string;
    } = {}
  ) =>
    apiFetch<Paginated<Due>>(
      `/estate/${estateId}/dues${toQuery({ page: opts.page ?? 1, pageSize: opts.pageSize ?? 30, status: opts.status, householdId: opts.householdId })}`
    ),
  charge: (estateId: string, body: NewCharge) =>
    apiFetch<{ created: number }>(`/estate/${estateId}/dues`, { method: 'POST', body }),
  markDuePaid: (estateId: string, dueId: string) =>
    apiFetch<Due>(`/estate/${estateId}/dues/${dueId}/pay`, { method: 'PATCH' }),

  announcements: (estateId: string, page = 1) =>
    apiFetch<Paginated<Announcement>>(
      `/estate/${estateId}/announcements${toQuery({ page, pageSize: 30 })}`
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
    apiFetch<Incident[]>(`/estate/${estateId}/incidents${toQuery({ status })}`),
  maintenance: (estateId: string, status?: string) =>
    apiFetch<MaintenanceTicket[]>(`/estate/${estateId}/maintenance${toQuery({ status })}`),
  violations: (estateId: string, status?: string) =>
    apiFetch<Violation[]>(`/estate/${estateId}/violations${toQuery({ status })}`),

  startIncident: (estateId: string, id: string) =>
    apiFetch<Incident>(`/estate/${estateId}/incidents/${id}/start`, { method: 'PATCH' }),
  closeIncident: (estateId: string, id: string, how: 'resolve' | 'dismiss', notes?: string) =>
    apiFetch<Incident>(`/estate/${estateId}/incidents/${id}/${how}`, {
      method: 'PATCH',
      body: notes ? { resolutionNotes: notes } : {},
    }),
  startMaintenance: (estateId: string, id: string) =>
    apiFetch<MaintenanceTicket>(`/estate/${estateId}/maintenance/${id}/start`, { method: 'PATCH' }),
  closeMaintenance: (estateId: string, id: string, how: 'resolve' | 'dismiss', notes?: string) =>
    apiFetch<MaintenanceTicket>(`/estate/${estateId}/maintenance/${id}/${how}`, {
      method: 'PATCH',
      body: notes ? { resolutionNotes: notes } : {},
    }),
  reportViolation: (
    estateId: string,
    body: { householdId: string; description: string; category: string }
  ) => apiFetch<Violation>(`/estate/${estateId}/violations`, { method: 'POST', body }),
  warnViolation: (estateId: string, id: string) =>
    apiFetch<Violation>(`/estate/${estateId}/violations/${id}/warn`, { method: 'PATCH' }),
  closeViolation: (estateId: string, id: string, how: 'resolve' | 'dismiss', notes?: string) =>
    apiFetch<Violation>(`/estate/${estateId}/violations/${id}/${how}`, {
      method: 'PATCH',
      body: notes ? { resolutionNotes: notes } : {},
    }),

  activeMuster: (estateId: string) =>
    apiFetchOrNull<EmergencyMuster>(`/estate/${estateId}/emergency-musters/active`),
  musters: (estateId: string) =>
    apiFetch<Paginated<MusterSummary>>(
      `/estate/${estateId}/emergency-musters${toQuery({ page: 1, pageSize: 20 })}`
    ),
  muster: (estateId: string, musterId: string) =>
    apiFetch<EmergencyMuster>(`/estate/${estateId}/emergency-musters/${musterId}`),
  declareMuster: (
    estateId: string,
    body: { kind: EmergencyKind; description: string; assemblyPoint?: string }
  ) => apiFetch<EmergencyMuster>(`/estate/${estateId}/emergency-musters`, { method: 'POST', body }),
  setRollState: (
    estateId: string,
    musterId: string,
    entryId: string,
    state: MusterRollState,
    stateNote?: string
  ) =>
    apiFetch<EmergencyMuster>(`/estate/${estateId}/emergency-musters/${musterId}/roll/${entryId}`, {
      method: 'PATCH',
      body: { state, ...(stateNote ? { stateNote } : {}) },
    }),
  addMusterArrivals: (estateId: string, musterId: string) =>
    apiFetch<EmergencyMuster>(`/estate/${estateId}/emergency-musters/${musterId}/roll/arrivals`, {
      method: 'POST',
    }),
  closeMuster: (estateId: string, musterId: string, closingNote?: string) =>
    apiFetch<EmergencyMuster>(`/estate/${estateId}/emergency-musters/${musterId}/close`, {
      method: 'POST',
      body: closingNote ? { closingNote } : {},
    }),

  visitorPasses: (estateId: string, opts: { page?: number; status?: string } = {}) =>
    apiFetch<Paginated<VisitorPass>>(
      `/estate/${estateId}/visitor-passes${toQuery({ page: opts.page ?? 1, pageSize: 30, status: opts.status })}`
    ),
  issueVisitorPass: (
    estateId: string,
    body: {
      householdId: string;
      visitorName: string;
      visitorPhone?: string;
      purpose?: string;
      expiresAt?: string;
    }
  ) => apiFetch<IssuedVisitorPass>(`/estate/${estateId}/visitor-passes`, { method: 'POST', body }),
  revokeVisitorPass: (estateId: string, passId: string) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/${passId}/revoke`, {
      method: 'PATCH',
    }),

  reportDigest: (estateId: string) => apiFetch<ReportDigest>(`/estate/${estateId}/reports/digest`),
  /** Drafts to edit before posting; nothing is posted. */
  draftAnnouncement: (estateId: string, notes: string, language: ReplyLanguage = 'en') =>
    apiFetch<AnnouncementDraft>(`/estate/${estateId}/announcements/draft`, {
      method: 'POST',
      body: { notes, ...(language === 'en' ? {} : { language }) },
    }),
  draftPoll: (estateId: string, topic: string) =>
    apiFetch<PollDraft>(`/estate/${estateId}/polls/draft`, { method: 'POST', body: { topic } }),
  polls: (estateId: string) => apiFetch<Poll[]>(`/estate/${estateId}/polls`),
  createPoll: (estateId: string, body: { question: string; options: string[] }) =>
    apiFetch<Poll>(`/estate/${estateId}/polls`, { method: 'POST', body }),
  closePoll: (estateId: string, pollId: string) =>
    apiFetch<Poll>(`/estate/${estateId}/polls/${pollId}/close`, { method: 'PATCH' }),

  amenities: (estateId: string) => apiFetch<Amenity[]>(`/estate/${estateId}/amenities`),
  addAmenity: (estateId: string, body: { name: string; description?: string }) =>
    apiFetch<Amenity>(`/estate/${estateId}/amenities`, { method: 'POST', body }),
  removeAmenity: (estateId: string, amenityId: string) =>
    apiFetch<void>(`/estate/${estateId}/amenities/${amenityId}`, { method: 'DELETE' }),
  amenityBookings: (estateId: string) =>
    apiFetch<AmenityBooking[]>(`/estate/${estateId}/amenity-bookings`),
  cancelAmenityBooking: (estateId: string, bookingId: string) =>
    apiFetch<AmenityBooking>(`/estate/${estateId}/amenity-bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    }),

  /** No status lists every entry, lifted ones included. */
  watchlist: (estateId: string, status: 'ACTIVE' | 'LIFTED' | undefined, page = 1) =>
    apiFetch<Paginated<WatchlistEntry>>(
      `/estate/${estateId}/watchlist${toQuery({ page, pageSize: 30, status })}`
    ),
  addToWatchlist: (
    estateId: string,
    entry: {
      label: string;
      reason: string;
      subjectType: WatchlistSubjectType;
      severity: WatchlistSeverity;
      phone?: string;
      plateNumber?: string;
      expiresAt?: string;
      photo?: PickedFile | null;
    }
  ) => {
    const form = new FormData();
    form.append('label', entry.label);
    form.append('reason', entry.reason);
    form.append('subjectType', entry.subjectType);
    form.append('severity', entry.severity);
    if (entry.phone) form.append('phone', entry.phone);
    if (entry.plateNumber) form.append('plateNumber', entry.plateNumber);
    if (entry.expiresAt) form.append('expiresAt', entry.expiresAt);
    if (entry.photo) appendFile(form, 'file', entry.photo);
    return apiUpload<WatchlistEntry>(`/estate/${estateId}/watchlist`, form);
  },
  liftWatchlistEntry: (estateId: string, entryId: string, liftReason: string) =>
    apiFetch<WatchlistEntry>(`/estate/${estateId}/watchlist/${entryId}/lift`, {
      method: 'PATCH',
      body: { liftReason },
    }),
};

export function pickEstate<T extends { id: string }>(
  estates: T[] | undefined,
  storedId: string | null | undefined
): T | undefined {
  if (!estates?.length) return undefined;
  return estates.find((e) => e.id === storedId) ?? estates[0];
}

/** Unknown is treated as paid: see `planTier`. */
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

/** The API adds the late fee INTO `amount` once overdue (`lateFeeApplied` is only its share), so it must not be added again. */
export const dueTotal = (d: Pick<Due, 'amount'>) => d.amount;

export const isDueOpen = (d: Pick<Due, 'status'>) =>
  d.status === 'pending' || d.status === 'overdue' || d.status === 'processing';

export function dueWhen(d: Pick<Due, 'dueDate' | 'status' | 'paidDate'>, now = new Date()): string {
  if (d.status === 'paid') return 'Paid';
  if (d.status === 'waived') return 'Waived';
  const day = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round((day(new Date(d.dueDate)) - day(now)) / 86_400_000);
  if (days === 0) return 'Due today';
  if (days > 0) return `Due in ${days} day${days === 1 ? '' : 's'}`;
  return `${-days} day${days === -1 ? '' : 's'} overdue`;
}

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

export function chargeAudience(selected: number, activeHouseholds: number): string {
  if (!selected) return `Every active household (${activeHouseholds.toLocaleString('en-NG')})`;
  return `${selected} selected household${selected === 1 ? '' : 's'}`;
}

const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const INCIDENT_PRIORITY_TONE: Record<Incident['priority'], Tone> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};
export const TICKET_PRIORITY_TONE: Record<MaintenanceTicket['priority'], Tone> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};
export const categoryLabel = titleCase;

export const isOpenItem = (status: string) =>
  status === 'open' ||
  status === 'in_progress' ||
  status === 'reported' ||
  status === 'warning_issued';

export const VIOLATION_STATUS: Record<Violation['status'], { label: string; tone: Tone }> = {
  reported: { label: 'Recorded', tone: 'warning' },
  warning_issued: { label: 'Warning sent', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
};
export const VIOLATION_CATEGORIES: { value: string; label: string }[] = [
  { value: 'NOISE', label: 'Noise' },
  { value: 'UNAUTHORIZED_PARKING', label: 'Parking' },
  { value: 'PET_VIOLATION', label: 'Pets' },
  { value: 'PROPERTY_MAINTENANCE', label: 'Upkeep' },
  { value: 'OTHER', label: 'Other' },
];

export function byUrgency<T extends { priority: string; createdAt: string }>(items: T[]): T[] {
  const rank: Record<string, number> = { critical: 0, urgent: 0, high: 1, medium: 2, low: 3 };
  return [...items].sort(
    (a, b) =>
      (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9) || a.createdAt.localeCompare(b.createdAt)
  );
}

export const EMERGENCY_KINDS: { value: EmergencyKind; label: string }[] = [
  { value: 'FIRE', label: 'Fire' },
  { value: 'GAS_LEAK', label: 'Gas leak' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'OTHER', label: 'Other' },
];

export const ROLL_STATE: Record<MusterRollState, { label: string; tone: Tone }> = {
  UNACCOUNTED: { label: 'Not yet accounted for', tone: 'warning' },
  NEEDS_HELP: { label: 'Needs help', tone: 'danger' },
  ACCOUNTED: { label: 'Accounted for', tone: 'success' },
  NOT_ON_SITE: { label: 'Not on site', tone: 'neutral' },
};

export function rollOrder(roll: MusterRollEntry[]): MusterRollEntry[] {
  const rank: Record<MusterRollState, number> = {
    NEEDS_HELP: 0,
    UNACCOUNTED: 1,
    ACCOUNTED: 2,
    NOT_ON_SITE: 3,
  };
  return [...roll].sort(
    (a, b) =>
      rank[a.state] - rank[b.state] ||
      a.unitLabel.localeCompare(b.unitLabel, undefined, { numeric: true }) ||
      a.personName.localeCompare(b.personName)
  );
}

/** Closing with people still missing has to be explained; a settled roll does not. */
export const closingNoteRequired = (t: Pick<MusterTally, 'unaccounted'>) => t.unaccounted > 0;

export const isLivePass = (status: string) =>
  status === 'pending' ||
  status === 'approved' ||
  status === 'awaiting_approval' ||
  status === 'checked_in';

/** Past its end date: the gate no longer acts on it, so never present it as live. */
export const isLapsedWatchlistEntry = (
  e: Pick<WatchlistEntry, 'status' | 'expiresAt'>,
  now: Date = new Date()
) => e.status === 'ACTIVE' && !!e.expiresAt && new Date(e.expiresAt).getTime() <= now.getTime();

/** A registration as the gate reads it: upper case, no spaces or dashes. */
export const normalisePlate = (plate: string) => plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** No votes is 0, not NaN. */
export const pollShare = (voteCount: number, totalVotes: number) =>
  totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

/** None until somebody has voted, and several on a tie, so neither is reported as a winner. */
export function leadingOptions(poll: Pick<Poll, 'options' | 'totalVotes'>): string[] {
  if (!poll.totalVotes) return [];
  const top = Math.max(...poll.options.map((o) => o.voteCount));
  return poll.options.filter((o) => o.voteCount === top).map((o) => o.id);
}

export function turnout(totalVotes: number, households: number): string {
  if (!households) return `${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}`;
  return `${totalVotes} of ${households.toLocaleString('en-NG')} households (${pollShare(totalVotes, households)}%)`;
}

/** Poll choices as typed: trimmed, without blanks or repeats. Mirrors the API's rule. */
export function cleanPollOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of options) {
    const label = raw.trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push(label);
  }
  return out;
}

export function bookingBuckets(bookings: AmenityBooking[], now: Date = new Date()) {
  const upcoming: AmenityBooking[] = [];
  const past: AmenityBooking[] = [];
  for (const b of bookings) {
    if (b.status === 'confirmed' && new Date(b.endsAt).getTime() >= now.getTime()) upcoming.push(b);
    else past.push(b);
  }
  upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  past.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return { upcoming, past };
}
