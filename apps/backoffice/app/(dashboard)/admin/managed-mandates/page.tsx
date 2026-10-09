'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Sparkles } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageErrorState,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';

import { adminManagedService, type ManagedMandate } from '@/services/adminManagedService';
import { adminService } from '@/services/adminService';

const TIER_LABEL: Record<string, string> = {
  COLLECT_ONLY: 'Collect (5%)',
  COLLECT_MAINTAIN: 'Collect + Maintain (8%)',
  FULL_MANAGEMENT: 'Full management (10%)',
};

const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING_OWNER: { label: 'Opted in', variant: 'warning' },
  PENDING_OPS: { label: 'Signed, awaiting ops', variant: 'warning' },
};

/** Opt-ins sitting this long are worth chasing — the "Stale" saved view. */
const STALE_DAYS = 7;
const isStale = (m: ManagedMandate) =>
  Date.now() - new Date(m.createdAt).getTime() > STALE_DAYS * 86_400_000;

type View = 'all' | 'PENDING_OWNER' | 'PENDING_OPS' | 'stale';

const VIEW_PREDICATE: Record<View, (m: ManagedMandate) => boolean> = {
  all: () => true,
  PENDING_OWNER: (m) => m.status === 'PENDING_OWNER',
  PENDING_OPS: (m) => m.status === 'PENDING_OPS',
  stale: isStale,
};

const ManagedMandateCard = ({
  mandate,
  staffOptions,
  partnerOptions,
  selected,
  onToggleSelected,
}: {
  mandate: ManagedMandate;
  staffOptions: { value: string; label: string }[];
  partnerOptions: { value: string; label: string }[];
  selected: boolean;
  onToggleSelected: (id: string) => void;
}) => {
  const queryClient = useQueryClient();
  const [managerUserId, setManagerUserId] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activate = useMutation({
    mutationFn: () =>
      unwrap(adminManagedService.activate(mandate.id, managerUserId, deliveryPartner || undefined)),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not activate the engagement.'),
  });

  const status = STATUS_META[mandate.status] ?? {
    label: mandate.status,
    variant: 'neutral' as const,
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1.5 h-4 w-4 shrink-0 accent-primary"
            checked={selected}
            onChange={() => onToggleSelected(mandate.id)}
            aria-label={`Select ${mandate.propertyTitle ?? 'property'} for bulk activation`}
          />
          <div className="shrink-0 rounded-xl bg-muted p-2.5">
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{mandate.propertyTitle ?? 'Property'}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Owner: <span className="text-foreground">{mandate.ownerName ?? 'unknown'}</span> ·
              opted in {formatDate(mandate.createdAt)}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {mandate.servicingTier ? TIER_LABEL[mandate.servicingTier] : 'GetRentos Managed'}
            </p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="block">
            <span className="text-sm text-muted-foreground">Portfolio manager</span>
            <div className="mt-1 w-full sm:w-64">
              <Select
                ariaLabel={`Portfolio manager for ${mandate.propertyTitle ?? 'property'}`}
                value={managerUserId}
                onValueChange={setManagerUserId}
                options={[{ value: '', label: 'Choose a staff member…' }, ...staffOptions]}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Delivery partner (optional)</span>
            <div className="mt-1 w-full sm:w-64">
              <Select
                ariaLabel={`Delivery partner for ${mandate.propertyTitle ?? 'property'}`}
                value={deliveryPartner}
                onValueChange={setDeliveryPartner}
                options={[{ value: '', label: 'GetRentos operates it' }, ...partnerOptions]}
              />
            </div>
          </label>
        </div>
        <Button
          isLoading={activate.isPending}
          disabled={!managerUserId}
          onClick={() => activate.mutate()}
        >
          Assign &amp; activate
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </Card>
  );
};

/** The "Active engagements" mode: reassign the portfolio manager, in bulk. */
const ActiveEngagements = ({
  staffOptions,
}: {
  staffOptions: { value: string; label: string }[];
}) => {
  const queryClient = useQueryClient();
  const active = useQuery({
    queryKey: ['admin', 'managed-active'],
    queryFn: () => unwrap(adminManagedService.listActive()),
  });

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [newManager, setNewManager] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [endReason, setEndReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const all = useMemo(() => active.data ?? [], [active.data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter(
      (m) =>
        needle === '' ||
        (m.propertyTitle ?? '').toLowerCase().includes(needle) ||
        (m.ownerName ?? '').toLowerCase().includes(needle) ||
        (m.managerName ?? '').toLowerCase().includes(needle)
    );
  }, [all, search]);

  const visibleIds = useMemo(() => new Set(filtered.map((m) => m.id)), [filtered]);
  const selectedVisible = useMemo(
    () => selected.filter((id) => visibleIds.has(id)),
    [selected, visibleIds]
  );
  const allVisibleSelected = filtered.length > 0 && selectedVisible.length === filtered.length;
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelected(allVisibleSelected ? [] : filtered.map((m) => m.id));

  const reassign = useMutation({
    mutationFn: () => unwrap(adminManagedService.reassignBulk(selectedVisible, newManager)),
    onSuccess: (r) => {
      setError(null);
      setResult(
        `Reassigned ${r.reassigned}${r.skipped.length > 0 ? ` · skipped ${r.skipped.length} that could not move` : ''}.`
      );
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-active'] });
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message || 'Could not reassign the selected engagements.');
    },
  });

  const suspend = useMutation({
    mutationFn: () => unwrap(adminManagedService.suspendBulk(selectedVisible, pauseReason)),
    onSuccess: (r) => {
      setError(null);
      setResult(
        `Paused ${r.suspended}${r.skipped.length > 0 ? ` · skipped ${r.skipped.length} that could not pause` : ''}.`
      );
      setSelected([]);
      setPauseReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-active'] });
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message || 'Could not pause the selected engagements.');
    },
  });

  const resume = useMutation({
    mutationFn: () => unwrap(adminManagedService.resumeBulk(selectedVisible)),
    onSuccess: (r) => {
      setError(null);
      setResult(
        `Resumed ${r.resumed}${r.skipped.length > 0 ? ` · skipped ${r.skipped.length} that could not resume` : ''}.`
      );
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-active'] });
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message || 'Could not resume the selected engagements.');
    },
  });

  const requestEnd = useMutation({
    mutationFn: () =>
      unwrap(adminManagedService.requestTerminationBulk(selectedVisible, endReason)),
    onSuccess: (r) => {
      setError(null);
      setResult(
        `Requested end for ${r.raised}${r.skipped.length > 0 ? ` · skipped ${r.skipped.length} (e.g. already requested)` : ''}. A second staff member approves these in Termination requests.`
      );
      setSelected([]);
      setEndReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-active'] });
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message || 'Could not raise termination requests.');
    },
  });

  if (active.isError) {
    return (
      <PageErrorState
        title="Could not load engagements"
        description={(active.error as Error).message}
        onRetry={() => {
          void active.refetch();
        }}
      />
    );
  }
  if (active.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (all.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No live engagements"
        description="No GetRentos Managed engagements are active right now."
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search property, owner or manager…"
          aria-label="Search active engagements"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-72"
        />
      </div>

      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={allVisibleSelected}
              onChange={toggleAll}
              aria-label="Select all visible"
            />
            {selectedVisible.length > 0
              ? `${selectedVisible.length} selected`
              : `Select all (${filtered.length})`}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <Select
                ariaLabel="New portfolio manager for the selected engagements"
                value={newManager}
                onValueChange={setNewManager}
                options={[{ value: '', label: 'Reassign to…' }, ...staffOptions]}
              />
            </div>
            <Button
              isLoading={reassign.isPending}
              disabled={!newManager || selectedVisible.length === 0}
              onClick={() => reassign.mutate()}
            >
              Reassign {selectedVisible.length || ''}
            </Button>
          </div>
        </div>
        {/* Pause / resume the selection — pausing needs a reason, kept on each. */}
        {selectedVisible.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-end">
            <input
              type="text"
              value={pauseReason}
              onChange={(event) => setPauseReason(event.target.value)}
              placeholder="Reason for pausing (min 10 characters)"
              aria-label="Reason for pausing the selected engagements"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-80"
            />
            <Button
              variant="outline"
              isLoading={suspend.isPending}
              disabled={pauseReason.trim().length < 10}
              onClick={() => suspend.mutate()}
            >
              Pause {selectedVisible.length}
            </Button>
            <Button variant="outline" isLoading={resume.isPending} onClick={() => resume.mutate()}>
              Resume {selectedVisible.length}
            </Button>
          </div>
        )}
        {/* Raise a termination request — the maker half. A second staff member
            approves it under "Termination requests"; nothing ends here. */}
        {selectedVisible.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-end">
            <input
              type="text"
              value={endReason}
              onChange={(event) => setEndReason(event.target.value)}
              placeholder="Reason to request ending (min 10 characters)"
              aria-label="Reason to request ending the selected engagements"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-80"
            />
            <Button
              variant="danger"
              isLoading={requestEnd.isPending}
              disabled={endReason.trim().length < 10}
              onClick={() => requestEnd.mutate()}
            >
              Request end {selectedVisible.length}
            </Button>
          </div>
        )}
      </div>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      {result && <p className="mb-3 text-sm text-muted-foreground">{result}</p>}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nothing matches"
          description="No active engagements match your search."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((mandate) => {
            const status = STATUS_META[mandate.status] ?? {
              label:
                mandate.status === 'ACTIVE'
                  ? 'Active'
                  : mandate.status === 'SUSPENDED'
                    ? 'Suspended'
                    : mandate.status,
              variant: (mandate.status === 'ACTIVE' ? 'success' : 'warning') as BadgeVariant,
            };
            return (
              <Card key={mandate.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1.5 h-4 w-4 shrink-0 accent-primary"
                      checked={selected.includes(mandate.id)}
                      onChange={() => toggle(mandate.id)}
                      aria-label={`Select ${mandate.propertyTitle ?? 'property'} to reassign`}
                    />
                    <div className="shrink-0 rounded-xl bg-muted p-2.5">
                      <Building2 className="h-5 w-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {mandate.propertyTitle ?? 'Property'}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Owner:{' '}
                        <span className="text-foreground">{mandate.ownerName ?? 'unknown'}</span> ·
                        manager:{' '}
                        <span className="text-foreground">
                          {mandate.managerName ?? 'unassigned'}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {mandate.servicingTier
                          ? TIER_LABEL[mandate.servicingTier]
                          : 'GetRentos Managed'}
                        {mandate.deliveryPartnerName
                          ? ` · delivered by ${mandate.deliveryPartnerName}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

/** The "Termination requests" mode: the checker half — bulk-approve open asks. */
const TerminationRequests = () => {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ['admin', 'managed-termination-requests'],
    queryFn: () => unwrap(adminManagedService.listTerminationRequests()),
  });

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const all = useMemo(() => requests.data ?? [], [requests.data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter(
      (r) =>
        needle === '' ||
        (r.propertyTitle ?? '').toLowerCase().includes(needle) ||
        (r.ownerName ?? '').toLowerCase().includes(needle) ||
        (r.requestedByName ?? '').toLowerCase().includes(needle)
    );
  }, [all, search]);

  // Selection keys off the mandate id, which the approve endpoint takes and which
  // is unique here (only one open request per mandate).
  const visibleIds = useMemo(() => new Set(filtered.map((r) => r.mandateId)), [filtered]);
  const selectedVisible = useMemo(
    () => selected.filter((id) => visibleIds.has(id)),
    [selected, visibleIds]
  );
  const allVisibleSelected = filtered.length > 0 && selectedVisible.length === filtered.length;
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelected(allVisibleSelected ? [] : filtered.map((r) => r.mandateId));

  const approve = useMutation({
    mutationFn: () => unwrap(adminManagedService.approveTerminationBulk(selectedVisible, note)),
    onSuccess: (r) => {
      setError(null);
      setResult(
        `Approved ${r.approved}${r.skipped.length > 0 ? ` · skipped ${r.skipped.length} (e.g. your own request, or notice not dischargeable)` : ''}.`
      );
      setSelected([]);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-termination-requests'] });
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message || 'Could not approve the selected requests.');
    },
  });

  if (requests.isError) {
    return (
      <PageErrorState
        title="Could not load requests"
        description={(requests.error as Error).message}
        onRetry={() => {
          void requests.refetch();
        }}
      />
    );
  }
  if (requests.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (all.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No requests waiting"
        description="No termination requests are awaiting a second approver."
      />
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Approving ends the engagement and revokes the manager’s access. You cannot approve a request
        you raised yourself — a different staff member must.
      </p>

      <div className="mb-4 flex justify-end">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search property, owner or requester…"
          aria-label="Search termination requests"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-72"
        />
      </div>

      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={allVisibleSelected}
            onChange={toggleAll}
            aria-label="Select all visible"
          />
          {selectedVisible.length > 0
            ? `${selectedVisible.length} selected`
            : `Select all (${filtered.length})`}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Approval note (min 10 characters)"
            aria-label="Approval note for the selected requests"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-80"
          />
          <Button
            variant="danger"
            isLoading={approve.isPending}
            disabled={note.trim().length < 10 || selectedVisible.length === 0}
            onClick={() => approve.mutate()}
          >
            Approve &amp; end {selectedVisible.length || ''}
          </Button>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      {result && <p className="mb-3 text-sm text-muted-foreground">{result}</p>}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing matches"
          description="No requests match your search."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1.5 h-4 w-4 shrink-0 accent-primary"
                    checked={selected.includes(request.mandateId)}
                    onChange={() => toggle(request.mandateId)}
                    aria-label={`Select the request for ${request.propertyTitle ?? 'property'}`}
                  />
                  <div className="shrink-0 rounded-xl bg-muted p-2.5">
                    <Building2 className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {request.propertyTitle ?? 'Property'}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Owner:{' '}
                      <span className="text-foreground">{request.ownerName ?? 'unknown'}</span> ·
                      requested by{' '}
                      <span className="text-foreground">{request.requestedByName ?? 'staff'}</span>{' '}
                      · {formatDate(request.createdAt)}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">“{request.reason}”</p>
                    {/* The notice position the approver is deciding against: when
                        GetRentos is the manager, the agreed period binds us, and
                        approving an unserved one ends it immediately. */}
                    {request.managerIsGetRentos && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {request.noticeServedAt ? (
                          <span>
                            Notice served {formatDate(request.noticeServedAt)} ·{' '}
                            {request.noticePeriodDays}-day period
                          </span>
                        ) : (
                          <>
                            <Badge variant="warning">Notice not served</Badge>
                            <span>
                              Approving ends the {request.noticePeriodDays}-day notice period now.
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={request.managerIsGetRentos ? 'success' : 'neutral'}>
                  {request.managerIsGetRentos ? 'GetRentos' : 'Firm'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default function AdminManagedMandatesPage() {
  const queryClient = useQueryClient();
  const pending = useQuery({
    queryKey: ['admin', 'managed-mandates'],
    queryFn: () => unwrap(adminManagedService.listPending()),
  });
  const staff = useQuery({
    queryKey: ['admin', 'staff', 'for-managed'],
    queryFn: () => unwrap(adminService.listStaff({ pageSize: 100 })),
  });
  const partners = useQuery({
    queryKey: ['admin', 'managed-partner-firms'],
    queryFn: () => unwrap(adminManagedService.listPartnerFirms()),
  });

  const [mode, setMode] = useState<'pending' | 'active' | 'requests'>('pending');
  const [view, setView] = useState<View>('all');
  const [tier, setTier] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkManager, setBulkManager] = useState('');
  const [bulkPartner, setBulkPartner] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const staffOptions = useMemo(
    () =>
      (staff.data?.items ?? []).map((member) => ({
        value: member.id,
        label: member.email ? `${member.legalName} · ${member.email}` : member.legalName,
      })),
    [staff.data]
  );
  const partnerOptions = useMemo(
    () => (partners.data ?? []).map((firm) => ({ value: firm.id, label: firm.name })),
    [partners.data]
  );

  const all = useMemo(() => pending.data ?? [], [pending.data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all
      .filter(VIEW_PREDICATE[view])
      .filter((m) => tier === 'all' || m.servicingTier === tier)
      .filter(
        (m) =>
          needle === '' ||
          (m.propertyTitle ?? '').toLowerCase().includes(needle) ||
          (m.ownerName ?? '').toLowerCase().includes(needle)
      );
  }, [all, view, tier, search]);

  // Keep the selection to what is actually on screen, so a hidden row is never
  // activated by a bulk action the operator cannot see.
  const visibleIds = useMemo(() => new Set(filtered.map((m) => m.id)), [filtered]);
  const selectedVisible = useMemo(
    () => selected.filter((id) => visibleIds.has(id)),
    [selected, visibleIds]
  );
  const allVisibleSelected = filtered.length > 0 && selectedVisible.length === filtered.length;

  const toggleSelected = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () => setSelected(allVisibleSelected ? [] : filtered.map((m) => m.id));

  const summarise = (verb: string, done: number, skipped: number) =>
    `${verb} ${done}${skipped > 0 ? ` · skipped ${skipped} that could not be` : ''}.`;

  const bulkActivate = useMutation({
    mutationFn: () =>
      unwrap(
        adminManagedService.activateBulk(selectedVisible, bulkManager, bulkPartner || undefined)
      ),
    onSuccess: (result) => {
      setBulkError(null);
      setBulkResult(summarise('Activated', result.activated, result.skipped.length));
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-mandates'] });
    },
    onError: (err: Error) => {
      setBulkResult(null);
      setBulkError(err.message || 'Could not activate the selected engagements.');
    },
  });

  const bulkReject = useMutation({
    mutationFn: () => unwrap(adminManagedService.rejectBulk(selectedVisible, bulkReason)),
    onSuccess: (result) => {
      setBulkError(null);
      setBulkResult(summarise('Refused', result.rejected, result.skipped.length));
      setSelected([]);
      setBulkReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-mandates'] });
    },
    onError: (err: Error) => {
      setBulkResult(null);
      setBulkError(err.message || 'Could not refuse the selected engagements.');
    },
  });

  const counts = useMemo(
    () => ({
      all: all.length,
      PENDING_OWNER: all.filter(VIEW_PREDICATE.PENDING_OWNER).length,
      PENDING_OPS: all.filter(VIEW_PREDICATE.PENDING_OPS).length,
      stale: all.filter(isStale).length,
    }),
    [all]
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
          GetRentos Managed
        </h1>
        <p className="mt-1 text-muted-foreground">
          Turn on owner opt-ins and run the live engagements — assigning, activating or reassigning
          a portfolio manager, one at a time or several at once.
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'pending' | 'active' | 'requests')}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Awaiting activation</TabsTrigger>
          <TabsTrigger value="active">Active engagements</TabsTrigger>
          <TabsTrigger value="requests">Termination requests</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'requests' ? (
        <TerminationRequests />
      ) : mode === 'active' ? (
        <ActiveEngagements staffOptions={staffOptions} />
      ) : pending.isError ? (
        <PageErrorState
          title="Could not load the queue"
          description={(pending.error as Error).message}
          onRetry={() => {
            void pending.refetch();
          }}
        />
      ) : pending.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : all.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing waiting"
          description="No GetRentos Managed opt-ins need activating right now."
        />
      ) : (
        <>
          {/* Saved views + tier filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList>
                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                <TabsTrigger value="PENDING_OWNER">Opted in ({counts.PENDING_OWNER})</TabsTrigger>
                <TabsTrigger value="PENDING_OPS">Awaiting ops ({counts.PENDING_OPS})</TabsTrigger>
                <TabsTrigger value="stale">Stale ({counts.stale})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search property or owner…"
                aria-label="Search by property or owner"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-60"
              />
              <div className="w-full sm:w-56">
                <Select
                  ariaLabel="Filter by servicing tier"
                  value={tier}
                  onValueChange={setTier}
                  options={[
                    { value: 'all', label: 'All tiers' },
                    { value: 'COLLECT_ONLY', label: TIER_LABEL.COLLECT_ONLY },
                    { value: 'COLLECT_MAINTAIN', label: TIER_LABEL.COLLECT_MAINTAIN },
                    { value: 'FULL_MANAGEMENT', label: TIER_LABEL.FULL_MANAGEMENT },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Bulk action bar */}
          <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all visible"
                />
                {selectedVisible.length > 0
                  ? `${selectedVisible.length} selected`
                  : `Select all (${filtered.length})`}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="w-full sm:w-60">
                  <Select
                    ariaLabel="Portfolio manager for the selected engagements"
                    value={bulkManager}
                    onValueChange={setBulkManager}
                    options={[{ value: '', label: 'Choose a staff member…' }, ...staffOptions]}
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Select
                    ariaLabel="Delivery partner for the selected engagements"
                    value={bulkPartner}
                    onValueChange={setBulkPartner}
                    options={[{ value: '', label: 'GetRentos operates it' }, ...partnerOptions]}
                  />
                </div>
                <Button
                  isLoading={bulkActivate.isPending}
                  disabled={!bulkManager || selectedVisible.length === 0}
                  onClick={() => bulkActivate.mutate()}
                >
                  Assign &amp; activate {selectedVisible.length || ''}
                </Button>
              </div>
            </div>
            {/* Refuse the selection — a reason is required and kept on each. */}
            {selectedVisible.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-end">
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(event) => setBulkReason(event.target.value)}
                  placeholder="Reason for refusing (min 10 characters)"
                  aria-label="Reason for refusing the selected engagements"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-96"
                />
                <Button
                  variant="outline"
                  isLoading={bulkReject.isPending}
                  disabled={bulkReason.trim().length < 10}
                  onClick={() => bulkReject.mutate()}
                >
                  Refuse {selectedVisible.length}
                </Button>
              </div>
            )}
          </div>
          {bulkError && <p className="mb-3 text-sm text-destructive">{bulkError}</p>}
          {bulkResult && <p className="mb-3 text-sm text-muted-foreground">{bulkResult}</p>}

          {filtered.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Nothing in this view"
              description="No opt-ins match the current filters."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((mandate) => (
                <ManagedMandateCard
                  key={mandate.id}
                  mandate={mandate}
                  staffOptions={staffOptions}
                  partnerOptions={partnerOptions}
                  selected={selected.includes(mandate.id)}
                  onToggleSelected={toggleSelected}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
