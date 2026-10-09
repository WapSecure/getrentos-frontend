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
  selected,
  onToggleSelected,
}: {
  mandate: ManagedMandate;
  staffOptions: { value: string; label: string }[];
  selected: boolean;
  onToggleSelected: (id: string) => void;
}) => {
  const queryClient = useQueryClient();
  const [managerUserId, setManagerUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activate = useMutation({
    mutationFn: () => unwrap(adminManagedService.activate(mandate.id, managerUserId)),
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

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block">
          <span className="text-sm text-muted-foreground">Portfolio manager</span>
          <div className="mt-1 w-full sm:w-72">
            <Select
              ariaLabel={`Portfolio manager for ${mandate.propertyTitle ?? 'property'}`}
              value={managerUserId}
              onValueChange={setManagerUserId}
              options={[{ value: '', label: 'Choose a staff member…' }, ...staffOptions]}
            />
          </div>
        </label>
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

  const [view, setView] = useState<View>('all');
  const [tier, setTier] = useState<string>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkManager, setBulkManager] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ activated: number; skipped: number } | null>(null);

  const staffOptions = useMemo(
    () =>
      (staff.data?.items ?? []).map((member) => ({
        value: member.id,
        label: member.email ? `${member.legalName} · ${member.email}` : member.legalName,
      })),
    [staff.data]
  );

  const all = useMemo(() => pending.data ?? [], [pending.data]);
  const filtered = useMemo(
    () =>
      all.filter(VIEW_PREDICATE[view]).filter((m) => tier === 'all' || m.servicingTier === tier),
    [all, view, tier]
  );

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

  const bulkActivate = useMutation({
    mutationFn: () => unwrap(adminManagedService.activateBulk(selectedVisible, bulkManager)),
    onSuccess: (result) => {
      setBulkError(null);
      setBulkResult({ activated: result.activated, skipped: result.skipped.length });
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-mandates'] });
    },
    onError: (err: Error) => {
      setBulkResult(null);
      setBulkError(err.message || 'Could not activate the selected engagements.');
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
          Owner opt-ins awaiting a portfolio manager. Assigning one activates the engagement and
          provisions their access to run the property — one at a time, or several at once.
        </p>
      </div>

      {pending.isError ? (
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
            <div className="w-full sm:w-64">
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

          {/* Bulk action bar */}
          <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="w-full sm:w-72">
                <Select
                  ariaLabel="Portfolio manager for the selected engagements"
                  value={bulkManager}
                  onValueChange={setBulkManager}
                  options={[{ value: '', label: 'Choose a staff member…' }, ...staffOptions]}
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
          {bulkError && <p className="mb-3 text-sm text-destructive">{bulkError}</p>}
          {bulkResult && (
            <p className="mb-3 text-sm text-muted-foreground">
              Activated {bulkResult.activated}
              {bulkResult.skipped > 0
                ? ` · skipped ${bulkResult.skipped} that could not be activated`
                : ''}
              .
            </p>
          )}

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
