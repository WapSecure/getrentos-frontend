'use client';

import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Home,
  Wallet,
  ShieldCheck,
  Wrench,
  Handshake,
  Megaphone,
  Users,
  ScrollText,
  FileText,
  BadgeCheck,
  Eye,
} from 'lucide-react';
import { Badge, Button, ConfirmDialog, Toast, type BadgeVariant } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminEstateService } from '@/services/adminEstateService';
import { EstateQueuePage, type EstateQueueConfig } from './EstateQueuePage';
import { adminKeys } from '@/lib/queryKeys';
import type {
  AdminEstateAnnouncementQueue,
  AdminEstateDueQueue,
  AdminEstateGovernanceRecord,
  AdminEstateGovernanceRecordDetail,
  AdminEstateHouseholdQueue,
  AdminEstateIncidentQueue,
  AdminEstateMaintenanceQueue,
  AdminEstatePollQueue,
  AdminEstateStaffMember,
  DueStatus,
  EstateAnnouncementPriority,
  EstateIncidentCategory,
  EstateIncidentPriority,
  EstateIncidentStatus,
  EstateMaintenanceCategory,
  EstateMaintenancePriority,
  EstateMaintenanceStatus,
  EstatePollStatus,
  GovernanceRecordStatus,
  GovernanceRecordType,
  HouseholdStatus,
  OrgRole,
  WorkspaceRole,
} from '@/types/estate';

const naira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const Pill = ({ label, variant }: { label: string; variant: BadgeVariant }) => (
  <Badge variant={variant}>{label}</Badge>
);

const Cell = ({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) => (
  <div className="min-w-0">
    <p className="font-medium text-foreground">{primary}</p>
    {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
  </div>
);

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

type EstateAction = {
  title: string;
  description: string;
  label: string;
  run: (reason: string) => Promise<unknown>;
};

function useEstateActions() {
  const client = useQueryClient();
  const [action, setAction] = useState<EstateAction | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const mutation = useMutation({
    mutationFn: async () => action?.run(reason.trim()),
    onSuccess: async () => {
      setAction(null);
      setReason('');
      setToast({ message: 'Estate action completed and audited.', variant: 'success' });
      await client.invalidateQueries({ queryKey: ['admin', 'estates'] });
    },
    onError: (error: Error) => setToast({ message: error.message, variant: 'error' }),
  });

  return {
    request: setAction,
    feedback: (
      <>
        <ConfirmDialog
          open={Boolean(action)}
          onOpenChange={(open) => !open && setAction(null)}
          title={action?.title ?? 'Confirm action'}
          description={action?.description ?? ''}
          confirmLabel={action?.label}
          isLoading={mutation.isPending}
          promptLabel="Administrative reason"
          promptValue={reason}
          onPromptChange={setReason}
          promptRequired
          promptMinLength={10}
          onConfirm={() => mutation.mutate()}
        />
        {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
      </>
    ),
  };
}

const householdStatusVariant = (status: HouseholdStatus): BadgeVariant =>
  status === 'ACTIVE' ? 'success' : 'neutral';

const dueStatusVariant = (status: DueStatus): BadgeVariant => {
  const map: Record<DueStatus, BadgeVariant> = {
    PENDING: 'warning',
    PAID: 'success',
    OVERDUE: 'danger',
    PROCESSING: 'info',
  };
  return map[status] ?? 'neutral';
};

const incidentStatusVariant = (status: EstateIncidentStatus): BadgeVariant => {
  const map: Record<EstateIncidentStatus, BadgeVariant> = {
    OPEN: 'danger',
    IN_PROGRESS: 'warning',
    RESOLVED: 'success',
    DISMISSED: 'neutral',
  };
  return map[status] ?? 'neutral';
};

const incidentPriorityVariant = (priority: EstateIncidentPriority): BadgeVariant => {
  const map: Record<EstateIncidentPriority, BadgeVariant> = {
    LOW: 'neutral',
    MEDIUM: 'info',
    HIGH: 'warning',
    CRITICAL: 'danger',
  };
  return map[priority] ?? 'neutral';
};

const maintenanceStatusVariant = (status: EstateMaintenanceStatus): BadgeVariant => {
  const map: Record<EstateMaintenanceStatus, BadgeVariant> = {
    OPEN: 'danger',
    IN_PROGRESS: 'warning',
    RESOLVED: 'success',
    DISMISSED: 'neutral',
  };
  return map[status] ?? 'neutral';
};

const maintenancePriorityVariant = (priority: EstateMaintenancePriority): BadgeVariant => {
  const map: Record<EstateMaintenancePriority, BadgeVariant> = {
    LOW: 'neutral',
    MEDIUM: 'info',
    HIGH: 'warning',
    URGENT: 'danger',
  };
  return map[priority] ?? 'neutral';
};

const pollStatusVariant = (status: EstatePollStatus): BadgeVariant =>
  status === 'OPEN' ? 'success' : 'neutral';

const announcementPriorityVariant = (priority: EstateAnnouncementPriority): BadgeVariant =>
  priority === 'URGENT' ? 'danger' : 'neutral';

const orgRoleVariant = (role: OrgRole): BadgeVariant => {
  const map: Record<OrgRole, BadgeVariant> = {
    OWNER: 'success',
    STAFF: 'info',
    ACCOUNTANT: 'warning',
  };
  return map[role] ?? 'neutral';
};

const workspaceRoleVariant = (role: WorkspaceRole | undefined): BadgeVariant =>
  role === 'GATEMAN' ? 'info' : role === 'RESIDENT' ? 'success' : 'neutral';

const governanceTypeVariant = (type: GovernanceRecordType): BadgeVariant =>
  type === 'BYLAWS' ? 'info' : type === 'MEETING_MINUTES' ? 'warning' : 'neutral';

const governanceStatusVariant = (status: GovernanceRecordStatus): BadgeVariant => {
  const map: Record<GovernanceRecordStatus, BadgeVariant> = {
    PUBLISHED: 'info',
    PENDING_SIGNATURES: 'warning',
    APPROVED: 'success',
  };
  return map[status] ?? 'neutral';
};

const householdStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];
const residentLinkedOptions = [
  { value: 'true', label: 'Resident-linked' },
  { value: 'false', label: 'Unlinked' },
];
const dueStatusOptions: { value: DueStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PROCESSING', label: 'Processing' },
];
const incidentStatusOptions: { value: EstateIncidentStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];
const incidentCategoryOptions: { value: EstateIncidentCategory; label: string }[] = [
  { value: 'SECURITY', label: 'Security' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];
const incidentPriorityOptions: { value: EstateIncidentPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];
const maintenanceStatusOptions: { value: EstateMaintenanceStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];
const maintenanceCategoryOptions: { value: EstateMaintenanceCategory; label: string }[] = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'COMMON_AREA', label: 'Common area' },
  { value: 'OTHER', label: 'Other' },
];
const maintenancePriorityOptions: { value: EstateMaintenancePriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];
const pollStatusOptions: { value: EstatePollStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
];
const announcementPriorityOptions: { value: EstateAnnouncementPriority; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' },
];
const orgRoleOptions: { value: OrgRole; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
];
const workspaceRoleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: 'GATEMAN', label: 'Gateman' },
  { value: 'RESIDENT', label: 'Resident' },
];
const governanceTypeOptions: { value: GovernanceRecordType; label: string }[] = [
  { value: 'BYLAWS', label: 'Bylaws' },
  { value: 'MEETING_MINUTES', label: 'Meeting minutes' },
  { value: 'OTHER', label: 'Other' },
];
const governanceStatusOptions: { value: GovernanceRecordStatus; label: string }[] = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'PENDING_SIGNATURES', label: 'Pending signatures' },
  { value: 'APPROVED', label: 'Approved' },
];

export function HouseholdsQueue() {
  const config: EstateQueueConfig<AdminEstateHouseholdQueue> = {
    resource: 'households',
    eyebrow: 'Households',
    title: 'Estate households',
    description: 'Every estate unit and its resident link, status and directory opt-in.',
    icon: Home,
    filters: [
      { key: 'status', label: 'Status', options: householdStatusOptions },
      { key: 'residentLinked', label: 'Resident link', options: residentLinkedOptions },
    ],
    listFn: (params) => adminEstateService.listHouseholds(params),
    getRowKey: (h) => h.id,
    columns: [
      {
        key: 'estate',
        header: 'Estate',
        render: (h) => (
          <Cell primary={h.estateName} secondary={`${h.estateCity}, ${h.estateState}`} />
        ),
      },
      {
        key: 'unit',
        header: 'Unit',
        render: (h) => <Cell primary={h.unitLabel} secondary={h.residentName} />,
      },
      {
        key: 'resident',
        header: 'Resident',
        render: (h) => (
          <Cell
            primary={h.residentUserId ? 'Linked account' : h.residentName}
            secondary={h.contactEmail ?? h.contactPhone}
          />
        ),
      },
      {
        key: 'directory',
        header: 'Directory',
        render: (h) => (
          <Pill
            label={h.directoryOptIn ? 'Opted in' : 'Opted out'}
            variant={h.directoryOptIn ? 'success' : 'neutral'}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (h) => (
          <Pill label={titleCase(h.status)} variant={householdStatusVariant(h.status)} />
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (h) => <span className="text-muted-foreground">{date(h.createdAt)}</span>,
      },
    ],
  };
  return <EstateQueuePage config={config} />;
}

export function DuesQueue() {
  const config: EstateQueueConfig<AdminEstateDueQueue> = {
    resource: 'dues',
    eyebrow: 'Dues & Levies',
    title: 'Household due ledger',
    description: 'Platform-wide per-household levies across estates — arrears = Overdue filter.',
    icon: Wallet,
    filters: [{ key: 'status', label: 'Status', options: dueStatusOptions }],
    listFn: (params) => adminEstateService.listDues(params),
    getRowKey: (d) => d.id,
    columns: [
      {
        key: 'estate',
        header: 'Estate',
        render: (d) => <Cell primary={d.estateName} secondary={d.unitLabel ?? d.residentName} />,
      },
      {
        key: 'household',
        header: 'Household',
        render: (d) => (
          <Cell
            primary={d.residentName}
            secondary={`${d.billingCycle ?? ''} · ${d.category ?? ''}`}
          />
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (d) => <p className="font-medium text-foreground">{naira(d.amount)}</p>,
      },
      {
        key: 'dueDate',
        header: 'Due',
        render: (d) => (
          <Cell
            primary={date(d.dueDate)}
            secondary={d.paidDate ? `Paid ${date(d.paidDate)}` : undefined}
          />
        ),
      },
      {
        key: 'recurring',
        header: 'Recurring',
        render: (d) => (
          <Pill
            label={d.isRecurring ? 'Recurring' : 'One-off'}
            variant={d.isRecurring ? 'info' : 'neutral'}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (d) => <Pill label={titleCase(d.status)} variant={dueStatusVariant(d.status)} />,
      },
    ],
  };
  return <EstateQueuePage config={config} />;
}

export function IncidentsQueue() {
  const actions = useEstateActions();
  const config: EstateQueueConfig<AdminEstateIncidentQueue> = {
    resource: 'incidents',
    eyebrow: 'Incidents',
    title: 'Estate incidents',
    description: 'Security, safety and estate-wide incident reports with reporter context.',
    icon: ShieldCheck,
    filters: [
      { key: 'status', label: 'Status', options: incidentStatusOptions },
      { key: 'category', label: 'Category', options: incidentCategoryOptions },
      { key: 'priority', label: 'Priority', options: incidentPriorityOptions },
    ],
    listFn: (params) => adminEstateService.listIncidents(params),
    getRowKey: (i) => i.id,
    columns: [
      {
        key: 'estate',
        header: 'Estate',
        render: (i) => <Cell primary={i.estateName} secondary={date(i.createdAt)} />,
      },
      {
        key: 'incident',
        header: 'Incident',
        render: (i) => (
          <Cell
            primary={i.description}
            secondary={`${titleCase(i.category)} · Reported by ${i.reportedByName ?? '—'}`}
          />
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (i) => (
          <Pill label={titleCase(i.priority)} variant={incidentPriorityVariant(i.priority)} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (i) => (
          <Pill label={titleCase(i.status)} variant={incidentStatusVariant(i.status)} />
        ),
      },
    ],
    actions: (incident) => {
      if (incident.status === 'RESOLVED' || incident.status === 'DISMISSED') return null;
      return (
        <div className="flex justify-end gap-1">
          {incident.status === 'OPEN' && (
            <Button size="xs" variant="outline" onClick={() => actions.request({ title: 'Start incident response?', description: 'The incident will be marked in progress and the reason retained in the audit trail.', label: 'Start response', run: (reason) => unwrap(adminEstateService.updateIncidentStatus(incident.id, 'IN_PROGRESS', reason)) })}>Start</Button>
          )}
          <Button size="xs" onClick={() => actions.request({ title: 'Resolve incident?', description: 'Confirm that the incident has been investigated and resolved.', label: 'Resolve', run: (reason) => unwrap(adminEstateService.updateIncidentStatus(incident.id, 'RESOLVED', reason)) })}>Resolve</Button>
          <Button size="xs" variant="danger" onClick={() => actions.request({ title: 'Dismiss incident?', description: 'Dismissal is terminal and requires a clear administrative reason.', label: 'Dismiss', run: (reason) => unwrap(adminEstateService.updateIncidentStatus(incident.id, 'DISMISSED', reason)) })}>Dismiss</Button>
        </div>
      );
    },
  };
  return <><EstateQueuePage config={config} />{actions.feedback}</>;
}

export function EstateMaintenanceQueue() {
  const actions = useEstateActions();
  const config: EstateQueueConfig<AdminEstateMaintenanceQueue> = {
    resource: 'maintenance',
    eyebrow: 'Maintenance',
    title: 'Estate maintenance tickets',
    description: 'Resident-reported maintenance tickets scoped to households and estates.',
    icon: Wrench,
    filters: [
      { key: 'status', label: 'Status', options: maintenanceStatusOptions },
      { key: 'category', label: 'Category', options: maintenanceCategoryOptions },
      { key: 'priority', label: 'Priority', options: maintenancePriorityOptions },
    ],
    listFn: (params) => adminEstateService.listMaintenanceTickets(params),
    getRowKey: (m) => m.id,
    columns: [
      {
        key: 'estate',
        header: 'Estate',
        render: (m) => <Cell primary={m.estateName} secondary={m.unitLabel ?? '—'} />,
      },
      {
        key: 'ticket',
        header: 'Ticket',
        render: (m) => (
          <Cell
            primary={m.description}
            secondary={`${titleCase(m.category)} · Reported by ${m.reportedByName ?? '—'}`}
          />
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (m) => (
          <Pill label={titleCase(m.priority)} variant={maintenancePriorityVariant(m.priority)} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (m) => (
          <Pill label={titleCase(m.status)} variant={maintenanceStatusVariant(m.status)} />
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (m) => <span className="text-muted-foreground">{date(m.createdAt)}</span>,
      },
    ],
    actions: (ticket) => {
      if (ticket.status === 'RESOLVED' || ticket.status === 'DISMISSED') return null;
      return (
        <div className="flex justify-end gap-1">
          {ticket.status === 'OPEN' && <Button size="xs" variant="outline" onClick={() => actions.request({ title: 'Start maintenance response?', description: 'The estate ticket will be marked in progress.', label: 'Start work', run: (reason) => unwrap(adminEstateService.updateMaintenanceStatus(ticket.id, 'IN_PROGRESS', reason)) })}>Start</Button>}
          <Button size="xs" onClick={() => actions.request({ title: 'Resolve maintenance ticket?', description: 'Confirm the reported estate issue has been resolved.', label: 'Resolve', run: (reason) => unwrap(adminEstateService.updateMaintenanceStatus(ticket.id, 'RESOLVED', reason)) })}>Resolve</Button>
          <Button size="xs" variant="danger" onClick={() => actions.request({ title: 'Dismiss maintenance ticket?', description: 'Dismissal is terminal and requires a clear administrative reason.', label: 'Dismiss', run: (reason) => unwrap(adminEstateService.updateMaintenanceStatus(ticket.id, 'DISMISSED', reason)) })}>Dismiss</Button>
        </div>
      );
    },
  };
  return <><EstateQueuePage config={config} />{actions.feedback}</>;
}

export function PollsQueue() {
  const actions = useEstateActions();
  const config: EstateQueueConfig<AdminEstatePollQueue> = {
    resource: 'polls',
    eyebrow: 'Polls',
    title: 'Estate polls',
    description: 'Community polls with vote counts and closing state.',
    icon: Handshake,
    filters: [{ key: 'status', label: 'Status', options: pollStatusOptions }],
    listFn: (params) => adminEstateService.listPolls(params),
    getRowKey: (p) => p.id,
    columns: [
      {
        key: 'estate',
        header: 'Estate',
        render: (p) => <Cell primary={p.estateName} secondary={date(p.createdAt)} />,
      },
      {
        key: 'poll',
        header: 'Poll',
        render: (p) => (
          <Cell primary={p.question} secondary={`Created by ${p.createdByName ?? '—'}`} />
        ),
      },
      {
        key: 'votes',
        header: 'Votes',
        render: (p) => <span className="font-medium text-foreground">{p.voteCount}</span>,
      },
      {
        key: 'closes',
        header: 'Closes',
        render: (p) => (
          <span className="text-muted-foreground">{p.closesAt ? date(p.closesAt) : '—'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (p) => <Pill label={titleCase(p.status)} variant={pollStatusVariant(p.status)} />,
      },
    ],
    actions: (poll) => poll.status === 'OPEN' ? <Button size="xs" variant="outline" onClick={() => actions.request({ title: 'Close poll?', description: 'Voting will stop immediately. Existing votes remain available for reporting.', label: 'Close poll', run: (reason) => unwrap(adminEstateService.closePoll(poll.id, reason)) })}>Close</Button> : null,
  };
  return <><EstateQueuePage config={config} />{actions.feedback}</>;
}

export function AnnouncementsQueue() {
  const actions = useEstateActions();
  const config: EstateQueueConfig<AdminEstateAnnouncementQueue> = {
    resource: 'announcements',
    eyebrow: 'Announcements',
    title: 'Estate announcements',
    description: 'Estate notices with priority and author context.',
    icon: Megaphone,
    filters: [{ key: 'priority', label: 'Priority', options: announcementPriorityOptions }],
    listFn: (params) => adminEstateService.listAnnouncements(params),
    getRowKey: (a) => a.id,
    columns: [
      {
        key: 'estate',
        header: 'Estate',
        render: (a) => <Cell primary={a.estateName} secondary={date(a.createdAt)} />,
      },
      {
        key: 'announcement',
        header: 'Announcement',
        render: (a) => <Cell primary={a.title} secondary={a.body} />,
      },
      {
        key: 'author',
        header: 'Author',
        render: (a) => <span className="text-muted-foreground">{a.createdByName ?? '—'}</span>,
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (a) =>
          a.priority ? (
            <Pill label={titleCase(a.priority)} variant={announcementPriorityVariant(a.priority)} />
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    actions: (announcement) => <Button size="xs" variant="danger" onClick={() => actions.request({ title: 'Remove announcement?', description: 'The notice will be removed from the estate feed. The reason remains in the audit log.', label: 'Remove', run: (reason) => unwrap(adminEstateService.removeAnnouncement(announcement.id, reason)) })}>Remove</Button>,
  };
  return <><EstateQueuePage config={config} />{actions.feedback}</>;
}

export function StaffQueue() {
  const config: EstateQueueConfig<AdminEstateStaffMember> = {
    resource: 'staff',
    eyebrow: 'Staff & Access',
    title: 'Estate staff & access',
    description: 'Managers, gatemen and residents across estate organizations.',
    icon: Users,
    filters: [
      { key: 'orgRole', label: 'Org role', options: orgRoleOptions },
      { key: 'workspaceRole', label: 'Workspace role', options: workspaceRoleOptions },
    ],
    listFn: (params) => adminEstateService.listStaff(params),
    getRowKey: (s) => s.id,
    columns: [
      {
        key: 'member',
        header: 'Member',
        render: (s) => <Cell primary={s.legalName} secondary={s.email ?? 'No email'} />,
      },
      {
        key: 'organization',
        header: 'Organization',
        render: (s) => (
          <Cell
            primary={s.organizationName}
            secondary={s.estates.map((e) => e.name).join(', ') || '—'}
          />
        ),
      },
      {
        key: 'orgRole',
        header: 'Org role',
        render: (s) => <Pill label={titleCase(s.orgRole)} variant={orgRoleVariant(s.orgRole)} />,
      },
      {
        key: 'workspaceRole',
        header: 'Workspace role',
        render: (s) => (
          <Pill
            label={s.workspaceRole ? titleCase(s.workspaceRole) : '—'}
            variant={workspaceRoleVariant(s.workspaceRole)}
          />
        ),
      },
      {
        key: 'added',
        header: 'Added',
        render: (s) => <span className="text-muted-foreground">{date(s.createdAt)}</span>,
      },
    ],
  };
  return <EstateQueuePage config={config} />;
}

export function GovernanceQueue() {
  const [active, setActive] = useState<AdminEstateGovernanceRecord | null>(null);
  const config: EstateQueueConfig<AdminEstateGovernanceRecord> = {
    resource: 'governance-records',
    eyebrow: 'Governance',
    title: 'Governance records',
    description: 'Bylaws and meeting minutes across estates with signature status.',
    icon: ScrollText,
    filters: [
      { key: 'type', label: 'Type', options: governanceTypeOptions },
      { key: 'status', label: 'Status', options: governanceStatusOptions },
    ],
    listFn: (params) => adminEstateService.listGovernanceRecords(params),
    getRowKey: (g) => g.id,
    columns: [
      {
        key: 'record',
        header: 'Record',
        render: (g) => (
          <Cell
            primary={g.title}
            secondary={`v${g.version} · ${titleCase(g.type)} · ${g.estateName}`}
          />
        ),
      },
      {
        key: 'uploaded',
        header: 'Uploaded by',
        render: (g) => (
          <Cell primary={g.uploadedByName ?? '—'} secondary={date(g.meetingDate ?? g.createdAt)} />
        ),
      },
      {
        key: 'signatures',
        header: 'Signatures',
        render: (g) => (
          <Cell
            primary={String(g.signatureCount)}
            secondary={g.requiresSignatures ? 'Required' : 'Optional'}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (g) => (
          <Pill label={titleCase(g.status)} variant={governanceStatusVariant(g.status)} />
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (g) => (
          <Button variant="outline" size="sm" onClick={() => setActive(g)}>
            <Eye className="mr-1 h-3.5 w-3.5" /> View
          </Button>
        ),
        className: 'text-right',
      },
    ],
  };

  return (
    <>
      <EstateQueuePage config={config} />
      {active && <GovernanceDetailDialog recordId={active.id} onClose={() => setActive(null)} />}
    </>
  );
}

function GovernanceDetailDialog({ recordId, onClose }: { recordId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.estates('governance-records', { search: recordId }),
    queryFn: () => unwrap(adminEstateService.governanceRecordDetail(recordId)),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading governance record…</div>
        ) : isError || !data ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Could not load the governance record.</p>
            <Button className="mt-3" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <GovernanceDetail detail={data} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function GovernanceDetail({
  detail,
  onClose,
}: {
  detail: AdminEstateGovernanceRecordDetail;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-muted-foreground" />
            {detail.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.estateName} · {titleCase(detail.type)} · v{detail.version} · Created{' '}
            {date(detail.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={governanceTypeVariant(detail.type)}>{titleCase(detail.type)}</Badge>
          <Pill label={titleCase(detail.status)} variant={governanceStatusVariant(detail.status)} />
        </div>
      </div>

      <div className="space-y-5 p-5">
        {detail.versions.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <BadgeCheck className="h-4 w-4" /> Version history
            </p>
            <div className="space-y-2">
              {detail.versions.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                >
                  <p className="font-medium">v{v.version}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Pill label={titleCase(v.status)} variant={governanceStatusVariant(v.status)} />
                    <span>{v.signatureCount} signature(s)</span>
                    <span>{v.uploadedByName ?? ''}</span>
                    <span>{date(v.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Committee signatures
          </p>
          {detail.signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signatures recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {detail.signatures.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {s.residentName ?? s.unitLabel ?? 'Committee member'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.title ? `${titleCase(s.title)} · ` : ''}
                      {s.unitLabel ?? ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Signed {date(s.signedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border p-4">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
