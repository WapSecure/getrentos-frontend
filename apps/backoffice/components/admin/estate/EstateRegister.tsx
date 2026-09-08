'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Landmark,
  Search,
  MapPin,
  Home,
  Wallet,
  ShieldCheck,
  Wrench,
  Globe,
  BadgeCheck,
  UserRound,
  Users,
  Building2,
  FileText,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  PageErrorState,
  Pagination,
  LegacyInput,
  type BadgeVariant,
} from '@getrentos/ui';
import { cn, unwrap } from '@getrentos/shared';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { adminEstateService } from '@/services/adminEstateService';
import { adminKeys } from '@/lib/queryKeys';
import type { AdminEstate, AdminEstateDetail, HouseholdStatus, DueStatus } from '@/types/estate';

const PAGE_SIZE = 10;

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

export const EstateRegister = () => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<AdminEstate | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'estates', 'register', { search, city, state, page }],
    queryFn: () =>
      unwrap(
        adminEstateService.listEstates({
          search: search.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            <Landmark className="h-3 w-3" />
            Estates
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Estate register</h1>
          <p className="mt-1 text-muted-foreground">
            Every gated community with its organization, manager and community health.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <LegacyInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search estate, org or manager…"
              className="w-full pl-9"
            />
          </div>
          <LegacyInput
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
            placeholder="City…"
            className="w-32"
          />
          <LegacyInput
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
            placeholder="State…"
            className="w-32"
          />
        </div>

        {isError ? (
          <PageErrorState
            title="Could not load estates"
            description="The estate register is temporarily unavailable."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            className="min-h-[220px] rounded-none border-0"
          />
        ) : isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading estates…</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No estates found"
            description="Try adjusting your search or filters."
            className="min-h-[220px] rounded-none border-0"
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setActive(e)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{e.name}</p>
                    {e.micrositeEnabled && <Badge variant="success">Microsite live</Badge>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {e.address} · {e.city}, {e.state}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> {e.organizationName} · Manager:{' '}
                    {e.managerName}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {e.householdCount} household{e.householdCount === 1 ? '' : 's'} ·{' '}
                    {e.openIncidentCount} open incident
                    {e.openIncidentCount === 1 ? '' : 's'} · {e.openMaintenanceCount} open
                    maintenance
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right text-sm">
                    <p className="font-semibold">{e.overdueDueCount}</p>
                    <p className="text-xs text-muted-foreground">overdue dues</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">
                      {formatCurrency(e.collectedDueAmount, { compact: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">collected</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      {active && <EstateDetailDialog estateId={active.id} onClose={() => setActive(null)} />}
    </div>
  );
};

function EstateDetailDialog({ estateId, onClose }: { estateId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.estates('register', { search: estateId }),
    queryFn: () => unwrap(adminEstateService.estateDetail(estateId)),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading estate…</div>
        ) : isError || !data ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Could not load the estate case.</p>
            <Button className="mt-3" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <EstateCase360 detail={data} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function EstateCase360({ detail, onClose }: { detail: AdminEstateDetail; onClose: () => void }) {
  const stats = [
    {
      icon: Home,
      label: 'Households',
      value: detail.householdCount,
      sub: `${detail.activeHouseholds} active`,
    },
    {
      icon: Users,
      label: 'Resident-linked',
      value: detail.residentLinkedHouseholds,
      sub: detail.organization ? `${detail.organization.staffCount} staff` : undefined,
    },
    {
      icon: ShieldCheck,
      label: 'Open incidents',
      value: detail.openIncidentCount,
    },
    { icon: Wrench, label: 'Open maintenance', value: detail.openMaintenanceCount },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            {detail.name}
            {detail.microsite?.enabled && <Badge variant="success">Microsite live</Badge>}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {detail.address} · {detail.city}, {detail.state}
            {detail.gateCount ? ` · ${detail.gateCount} gate(s)` : ''}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {detail.organization?.name ?? ''} · Manager:{' '}
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {detail.organization?.manager.legalName ?? '—'}
            </span>{' '}
            ({detail.organization?.manager.email ?? 'no email'})
          </p>
          {detail.microsite && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5" /> {detail.microsite.slug}
              {detail.microsite.bio ? ` · ${detail.microsite.bio}` : ''}
            </p>
          )}
        </div>
        <Badge variant="neutral">Created {formatDate(detail.createdAt)}</Badge>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </p>
              <p className="mt-1 text-xl font-semibold">{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </div>
          ))}
        </div>

        {detail.dueSummary && (
          <div className="rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="h-4 w-4" /> Due summary
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniStat
                label="Collected"
                value={formatCurrency(detail.dueSummary.collectedAmount, { compact: true })}
                tone="success"
              />
              <MiniStat
                label="Outstanding"
                value={formatCurrency(detail.dueSummary.outstandingAmount, { compact: true })}
                tone="warning"
              />
              <MiniStat
                label="Overdue"
                value={String(detail.dueSummary.overdueCount)}
                tone="danger"
              />
              <MiniStat label="Total dues" value={String(detail.dueSummary.totalCount)} />
            </div>
          </div>
        )}

        {detail.households.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Recent households</p>
            <div className="space-y-2">
              {detail.households.slice(0, 6).map((h) => (
                <div
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                >
                  <p className="font-medium">{h.unitLabel}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{h.residentName}</span>
                    {h.residentLinked && <Badge variant="success">Linked</Badge>}
                    <Badge variant={householdStatusVariant(h.status)}>{h.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.recentDues.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Recent dues</p>
            <div className="space-y-2">
              {detail.recentDues.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                >
                  <p className="font-medium">{d.unitLabel ?? '—'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(d.amount)}
                    </span>
                    <span>{formatDate(d.dueDate)}</span>
                    <Badge variant={dueStatusVariant(d.status)}>{d.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {detail.recentIncidents.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent incidents</p>
              <div className="space-y-2">
                {detail.recentIncidents.slice(0, 4).map((i) => (
                  <div key={i.id} className="rounded-lg border border-border p-2.5 text-sm">
                    <p className="truncate font-medium">{i.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {i.category} · {i.priority} · {formatDate(i.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.recentMaintenance.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent maintenance</p>
              <div className="space-y-2">
                {detail.recentMaintenance.slice(0, 4).map((m) => (
                  <div key={m.id} className="rounded-lg border border-border p-2.5 text-sm">
                    <p className="truncate font-medium">{m.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.unitLabel ?? '—'} · {m.category} · {formatDate(m.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {detail.recentAnnouncements.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent announcements</p>
              <div className="space-y-2">
                {detail.recentAnnouncements.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <p className="truncate font-medium">{a.title}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.openPolls.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Open polls</p>
              <div className="space-y-2">
                {detail.openPolls.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <p className="truncate font-medium">{p.question}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      <span>{p.voteCount} votes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border p-4">
        <FileText className="mr-auto h-4 w-4 text-muted-foreground" />
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="rounded-lg bg-secondary/40 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-semibold',
          tone === 'success' && 'text-green-600 dark:text-green-400',
          tone === 'warning' && 'text-amber-600 dark:text-amber-400',
          tone === 'danger' && 'text-red-600 dark:text-red-400'
        )}
      >
        {value}
      </p>
    </div>
  );
}
