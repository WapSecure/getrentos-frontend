'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Eye, ShieldAlert } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  ListSkeleton,
  QueryState,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '@getrentos/ui';
import {
  formatDate,
  LAND_INCIDENT_KIND_LABELS,
  LAND_INSPECTION_KIND_LABELS,
  LAND_WATCH_TIER_LABELS,
  unwrap,
  type LandInspectionStatus,
  type StaffLandWatchIncident,
} from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { humaniseEnum, landQueryKeys, readLandApiError } from '@/lib/landDiligence';
import { adminLandWatchService } from '@/services/adminLandWatchService';
import { LandWatchJobs } from '@/components/admin/land/LandWatchJobs';

type Tab = 'inspections' | 'incidents' | 'jobs' | 'watched';
const STATUS_FILTERS: { value: 'open' | LandInspectionStatus; label: string }[] = [
  { value: 'open', label: 'Needing staff' },
  { value: 'REQUESTED', label: 'Unassigned' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'SUBMITTED', label: 'Awaiting acceptance' },
  { value: 'ASSIGNED', label: 'With inspector' },
  { value: 'ACCEPTED', label: 'Accepted' },
];

/** Land Watch operations: inspections to assign and review, incidents to decide. */
export default function AdminLandWatchPage() {
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [tab, setTab] = useState<Tab>('inspections');

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to Land Watch"
        description="It needs the verifications review permission."
      />
    );
  }
  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Land Watch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Field inspections of watched land and of land before purchase, and the incidents owners
          and inspectors report. Reports with doubtful GPS or media come first.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="mb-5">
        <TabsList aria-label="Land Watch view">
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="jobs">Vendor jobs</TabsTrigger>
          <TabsTrigger value="watched">Watched land</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === 'inspections' && <InspectionQueue />}
      {tab === 'incidents' && <Incidents canDecide={canDecide} />}
      {tab === 'jobs' && <LandWatchJobs />}
      {tab === 'watched' && <Watched />}
    </>
  );
}

function InspectionQueue() {
  const [filter, setFilter] = useState<'open' | LandInspectionStatus>('open');
  const query = useQuery({
    queryKey: landQueryKeys.watchInspections(filter),
    queryFn: () =>
      unwrap(adminLandWatchService.inspections(filter === 'open' ? undefined : filter)),
    placeholderData: keepPreviousData,
  });
  const rank = (s: string) =>
    s === 'ESCALATED' ? 0 : s === 'REQUESTED' ? 1 : s === 'SUBMITTED' ? 2 : 3;
  const items = [...(query.data ?? [])].sort((a, b) => rank(a.status) - rank(b.status));
  return (
    <>
      <div className="mb-4 w-56">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
          ariaLabel="Filter"
          options={STATUS_FILTERS}
        />
      </div>
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError && !query.data}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Inspections could not be loaded"
        errorDescription={query.error instanceof Error ? query.error.message : undefined}
        isEmpty={items.length === 0}
        empty={{
          icon: Eye,
          title: 'Nothing here',
          description: 'No inspections match this filter.',
        }}
      >
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((i) => (
            <li key={i.id}>
              <Link
                href={`/admin/land/watch/inspections/${encodeURIComponent(i.id)}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{i.land.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{i.reference}</span> ·{' '}
                    {LAND_INSPECTION_KIND_LABELS[i.kind]} · {i.land.city}, {i.land.state} ·{' '}
                    {i.inspector ? i.inspector.legalName : 'unassigned'}
                    {i.dueBy && ` · due ${formatDate(i.dueBy)}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {i.integrityFlags.length > 0 && (
                    <Badge variant="danger" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
                      {i.integrityFlags.length} flag{i.integrityFlags.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      i.status === 'ESCALATED'
                        ? 'danger'
                        : i.status === 'ACCEPTED'
                          ? 'success'
                          : 'info'
                    }
                  >
                    {humaniseEnum(i.status)}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </QueryState>
    </>
  );
}

function Incidents({ canDecide }: { canDecide: boolean }) {
  const query = useQuery({
    queryKey: landQueryKeys.watchIncidents,
    queryFn: () => unwrap(adminLandWatchService.incidents()),
  });
  return (
    <QueryState
      isLoading={query.isLoading}
      loading={<ListSkeleton variant="cards" rows={3} />}
      isError={query.isError && !query.data}
      onRetry={() => void query.refetch()}
      isRetrying={query.isFetching}
      errorTitle="Incidents could not be loaded"
      isEmpty={!query.data?.length}
      empty={{
        icon: Eye,
        title: 'No open incidents',
        description: 'Nothing reported is waiting.',
      }}
    >
      <ul className="space-y-3">
        {(query.data ?? []).map((i) => (
          <IncidentItem key={i.id} incident={i} canDecide={canDecide} />
        ))}
      </ul>
    </QueryState>
  );
}

function IncidentItem({
  incident: i,
  canDecide,
}: {
  incident: StaffLandWatchIncident;
  canDecide: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [note, setNote] = useState('');
  const done = (message: string) => {
    void queryClient.invalidateQueries({ queryKey: landQueryKeys.watchRoot });
    toast.success(message);
  };
  const failed = (e: unknown, fallback: string) =>
    toast.error(readLandApiError(e, fallback).message);
  const resolve = useMutation({
    mutationFn: (outcome: 'CONFIRMED' | 'DISMISSED') =>
      unwrap(adminLandWatchService.resolveIncident(i.id, outcome, note.trim())),
    onSuccess: (_r, outcome) =>
      done(
        outcome === 'CONFIRMED'
          ? 'Incident confirmed; the owner was told.'
          : 'Incident closed; the owner was told.'
      ),
    onError: (e) => failed(e, 'Could not record that.'),
  });
  const escalate = useMutation({
    mutationFn: () => unwrap(adminLandWatchService.escalateIncident(i.id)),
    onSuccess: () =>
      done(
        'Opened as a land dispute. The land is not on hold; place a hold from the dispute if needed.'
      ),
    onError: (e) => failed(e, 'Could not open a dispute.'),
  });
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {LAND_INCIDENT_KIND_LABELS[i.kind]} · {i.land}
          </p>
          <p className="text-xs text-muted-foreground">
            Reported {formatDate(i.createdAt)} by{' '}
            {i.source === 'INSPECTION'
              ? 'an inspection'
              : i.source === 'OWNER'
                ? 'the owner'
                : 'staff'}
          </p>
        </div>
        <Badge variant="warning">Open</Badge>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{i.description}</p>
      {i.inspectionId && (
        <Link
          href={`/admin/land/watch/inspections/${encodeURIComponent(i.inspectionId)}`}
          className="mt-1 inline-block text-sm text-primary hover:underline"
        >
          The inspection
        </Link>
      )}
      {canDecide && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            showCount
            placeholder="What was found and what happens next (the owner sees this)"
            aria-label="What was found and what happens next"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={note.trim().length < 5 || resolve.isPending}
              isLoading={resolve.isPending && resolve.variables === 'CONFIRMED'}
              onClick={() => resolve.mutate('CONFIRMED')}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={note.trim().length < 5 || resolve.isPending}
              isLoading={resolve.isPending && resolve.variables === 'DISMISSED'}
              onClick={() => resolve.mutate('DISMISSED')}
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isLoading={escalate.isPending}
              onClick={() => escalate.mutate()}
            >
              Open a dispute (bought plots)
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function Watched() {
  const query = useQuery({
    queryKey: landQueryKeys.watchSubscriptions,
    queryFn: () => unwrap(adminLandWatchService.subscriptions()),
  });
  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError && !query.data}
      onRetry={() => void query.refetch()}
      isRetrying={query.isFetching}
      errorTitle="Watched land could not be loaded"
      isEmpty={!query.data?.length}
      empty={{ icon: Eye, title: 'Nothing is watched yet' }}
    >
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {(query.data ?? []).map((w) => (
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{w.land.label}</p>
              <p className="text-xs text-muted-foreground">
                {w.land.city}, {w.land.state} · next inspection{' '}
                {w.nextInspectionDue ? formatDate(w.nextInspectionDue) : '—'}
                {w.lastInspection && ` · last ${formatDate(w.lastInspection)}`}
              </p>
            </div>
            <div className="flex gap-1.5">
              {w.openIncidents > 0 && <Badge variant="danger">{w.openIncidents} open</Badge>}
              <Badge variant={w.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {LAND_WATCH_TIER_LABELS[w.tier].label}
                {w.status === 'PAUSED' ? ' · paused' : ''}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </QueryState>
  );
}
