'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  Camera,
  CircleAlert,
  Eye,
  MapPin,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import {
  boundaryTone,
  LAND_BOUNDARY_LABELS,
  LAND_INCIDENT_KIND_LABELS,
  LAND_INCIDENT_STATUS_LABELS,
  LAND_INSPECTION_KIND_LABELS,
  LAND_INSPECTION_STATUS_LABELS,
  LAND_REMINDER_KIND_LABELS,
  LAND_WATCH_TIER_LABELS,
  type LandWatchDetail,
  type LandWatchIncidentKind,
  type LandWatchInspection,
  type LandWatchReminderKind,
  type LandWatchTier,
} from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { landKeys } from '@/lib/queryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import { landService } from '@/services/landService';
import { landWatchService } from '@/services/landWatchService';
import { errorMessage } from '../developer/feedback';

type Notify = (message: string, variant?: ToastVariant) => void;
const TIERS: LandWatchTier[] = ['ESSENTIAL', 'PROTECTED', 'MANAGED'];
const OWNING = new Set(['ACTIVE', 'PAID_IN_FULL', 'COMPLETED']);

/**
 * Land Watch for the person who owns the land: watched parcels and plots, the
 * inspection reports on them, incidents and obligation reminders. `?id=` opens
 * one watch; without it, the list and the form to start watching.
 */
export const LandWatchWorkspace = () => {
  const params = useSearchParams();
  const router = useRouter();
  const selected = params.get('id');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const notify: Notify = (message, variant = 'success') => setToast({ message, variant });
  const open = (id: string | null) =>
    router.push(id ? `/land/watch?id=${encodeURIComponent(id)}` : '/land/watch');

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      {selected ? (
        <WatchDetail id={selected} onBack={() => open(null)} notify={notify} />
      ) : (
        <WatchList onOpen={open} notify={notify} />
      )}
    </div>
  );
};

// ─── The list, and starting a watch ──────────────────────────────────────────

const WatchList = ({ onOpen, notify }: { onOpen: (id: string) => void; notify: Notify }) => {
  const [adding, setAdding] = useState(false);
  const watches = useQuery({
    queryKey: landKeys.watches,
    queryFn: () => unwrap(landWatchService.mine()),
  });
  const items = watches.data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Land Watch</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Independent eyes on land you own: inspections with photo and location evidence, alerts
            when something changes, and reminders for the charges land attracts.
          </p>
        </div>
        {!adding && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
            Watch land
          </Button>
        )}
      </div>
      {adding && (
        <SubscribeCard
          onCancel={() => setAdding(false)}
          onDone={(id) => {
            setAdding(false);
            notify('Land Watch started.');
            onOpen(id);
          }}
          notify={notify}
        />
      )}
      {watches.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : watches.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Your watched land could not be loaded"
          description={watches.error instanceof Error ? watches.error.message : undefined}
        />
      ) : items.length === 0 ? (
        !adding && (
          <EmptyState
            icon={Eye}
            title="Nothing watched yet"
            description="Watch a parcel you own or a plot you bought."
          />
        )
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((w) => (
            <li key={w.id}>
              <button type="button" onClick={() => onOpen(w.id)} className="w-full text-left">
                <Card hover static className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{w.land.label}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {[w.land.city, w.land.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <Badge variant={w.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {LAND_WATCH_TIER_LABELS[w.tier].label}
                      {w.status === 'PAUSED' ? ' · paused' : ''}
                    </Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Last inspection</dt>
                      <dd className="text-foreground">
                        {w.lastInspection ? formatDate(w.lastInspection) : 'None yet'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Next due</dt>
                      <dd className="text-foreground">
                        {w.nextInspectionDue ? formatDate(w.nextInspectionDue) : '—'}
                      </dd>
                    </div>
                  </dl>
                  {(w.openIncidents > 0 || w.nextReminder) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {w.openIncidents > 0 && (
                        <Badge variant="danger">
                          {w.openIncidents} open incident{w.openIncidents === 1 ? '' : 's'}
                        </Badge>
                      )}
                      {w.nextReminder && (
                        <Badge variant="info">
                          {w.nextReminder.label} · {formatDate(w.nextReminder.dueDate)}
                        </Badge>
                      )}
                    </div>
                  )}
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

const SubscribeCard = ({
  onCancel,
  onDone,
  notify,
}: {
  onCancel: () => void;
  onDone: (id: string) => void;
  notify: Notify;
}) => {
  const terms = useQuery({
    queryKey: landKeys.watchTerms,
    queryFn: () => unwrap(landWatchService.terms()),
  });
  // Either list may be refused for this account's roles; whichever answers is offered.
  const parcels = useQuery({
    queryKey: [...landKeys.owner, 'watch-options'],
    queryFn: () => unwrap(landService.listOwnerLand({ pageSize: 100 })),
    retry: false,
  });
  const plots = useQuery({
    queryKey: ['land', 'buyer', 'purchases', 'watch-options'],
    queryFn: () => unwrap(landBuyerService.listPurchases({ pageSize: 100 })),
    retry: false,
  });
  const options = [
    ...(parcels.data?.items ?? []).map((r) => ({
      value: `parcel:${r.property.id}`,
      label: `${r.property.title} (my land)`,
    })),
    ...(plots.data?.items ?? [])
      .filter((p) => OWNING.has(p.status))
      .map((p) => ({
        value: `plot:${p.plotId}`,
        label: `Plot ${p.block ? `${p.block}/` : ''}${p.plotNumber}, ${p.layoutName} (bought)`,
      })),
  ];
  const [target, setTarget] = useState('');
  const [tier, setTier] = useState<LandWatchTier>('PROTECTED');
  const [accepted, setAccepted] = useState(false);
  const subscribe = useMutation({
    mutationFn: () => {
      const [kind, id] = target.split(':');
      return unwrap(
        landWatchService.subscribe(
          kind === 'plot' ? { landPlotId: id, tier } : { propertyId: id, tier }
        )
      );
    },
    onSuccess: (detail) => onDone(detail.id),
    onError: (error) => notify(errorMessage(error, 'Could not start Land Watch.'), 'error'),
  });
  const loading = parcels.isLoading || plots.isLoading;

  return (
    <Card static className="space-y-4 p-5">
      <h2 className="font-semibold text-foreground">Watch land</h2>
      <Field label="Which land" required>
        <Select
          value={target}
          onValueChange={setTarget}
          ariaLabel="Which land"
          placeholder={
            loading
              ? 'Loading your land…'
              : options.length
                ? 'Choose'
                : 'You have no land to watch yet'
          }
          disabled={!options.length}
          options={options}
        />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Level</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIERS.map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-xl border p-3 text-sm ${tier === t ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <input
                type="radio"
                name="tier"
                className="sr-only"
                checked={tier === t}
                onChange={() => setTier(t)}
              />
              <span className="block font-medium text-foreground">
                {LAND_WATCH_TIER_LABELS[t].label}
              </span>
              <span className="mt-1 block text-muted-foreground">
                {LAND_WATCH_TIER_LABELS[t].description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {terms.data && (
        <label className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>{terms.data.disclaimer}</span>
        </label>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => subscribe.mutate()}
          isLoading={subscribe.isPending}
          disabled={!target || !accepted || subscribe.isPending}
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          Start watching
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
};

// ─── One watch ───────────────────────────────────────────────────────────────

const WatchDetail = ({
  id,
  onBack,
  notify,
}: {
  id: string;
  onBack: () => void;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const key = landKeys.watch(id);
  const query = useQuery({ queryKey: key, queryFn: () => unwrap(landWatchService.get(id)) });
  const saved = (detail: LandWatchDetail, message: string) => {
    queryClient.setQueryData(key, detail);
    void queryClient.invalidateQueries({ queryKey: landKeys.watches });
    notify(message);
  };
  const failed = (error: unknown, fallback: string) =>
    notify(errorMessage(error, fallback), 'error');

  if (query.isLoading)
    return <div className="h-96 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  if (query.isError || !query.data) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="This watch could not be loaded"
        description={query.error instanceof Error ? query.error.message : undefined}
      />
    );
  }
  const w = query.data;
  return (
    <>
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Land Watch
        </button>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{w.land.label}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {[w.land.city, w.land.state].filter(Boolean).join(', ')}
            </p>
          </div>
          <PlanControls watch={w} onSaved={saved} onFailed={failed} onCancelled={onBack} />
        </div>
        <p className="mt-3 max-w-3xl text-xs text-muted-foreground">{w.disclaimer}</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <InspectionsCard watch={w} onSaved={saved} onFailed={failed} />
        <div className="space-y-6">
          <IncidentsCard watch={w} onSaved={saved} onFailed={failed} />
          <RemindersCard watch={w} onSaved={saved} onFailed={failed} />
        </div>
      </div>
    </>
  );
};

interface SectionProps {
  watch: LandWatchDetail;
  onSaved: (detail: LandWatchDetail, message: string) => void;
  onFailed: (error: unknown, fallback: string) => void;
}

const PlanControls = ({
  watch,
  onSaved,
  onFailed,
  onCancelled,
}: SectionProps & { onCancelled: () => void }) => {
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const update = useMutation({
    mutationFn: (input: { tier?: LandWatchTier; status?: 'ACTIVE' | 'PAUSED' }) =>
      unwrap(landWatchService.update(watch.id, input)),
    onSuccess: (d) => onSaved(d, 'Saved.'),
    onError: (e) => onFailed(e, 'Could not change the plan.'),
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(landWatchService.cancel(watch.id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: landKeys.watches });
      onCancelled();
    },
    onError: (e) => onFailed(e, 'Could not stop watching.'),
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-44">
        <Select
          value={watch.tier}
          onValueChange={(t) => update.mutate({ tier: t as LandWatchTier })}
          ariaLabel="Level"
          options={TIERS.map((t) => ({ value: t, label: LAND_WATCH_TIER_LABELS[t].label }))}
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        isLoading={update.isPending}
        onClick={() => update.mutate({ status: watch.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED' })}
      >
        {watch.status === 'PAUSED' ? 'Resume' : 'Pause'}
      </Button>
      {confirmCancel ? (
        <>
          <Button
            size="sm"
            variant="danger"
            isLoading={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            Stop watching
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>
            Keep it
          </Button>
        </>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(true)}>
          Stop watching…
        </Button>
      )}
    </div>
  );
};

const InspectionsCard = ({ watch, onSaved, onFailed }: SectionProps) => (
  <Card static className="p-5">
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <Camera className="h-5 w-5 text-primary" aria-hidden="true" /> Inspections
      </h2>
      {watch.nextInspectionDue && (
        <span className="text-sm text-muted-foreground">
          Next due {formatDate(watch.nextInspectionDue)}
        </span>
      )}
    </div>
    {watch.inspections.length === 0 ? (
      <p className="mt-3 text-sm text-muted-foreground">
        {watch.tier === 'ESSENTIAL'
          ? 'Essential has no routine inspections. Report an incident to ask for one, or move to Protected.'
          : 'Your first inspection is being arranged.'}
      </p>
    ) : (
      <ul className="mt-4 space-y-4">
        {watch.inspections.map((i) => (
          <InspectionItem key={i.id} inspection={i} onSaved={onSaved} onFailed={onFailed} />
        ))}
      </ul>
    )}
  </Card>
);

const InspectionItem = ({
  inspection: i,
  onSaved,
  onFailed,
}: {
  inspection: LandWatchInspection;
  onSaved: SectionProps['onSaved'];
  onFailed: SectionProps['onFailed'];
}) => {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const reinspect = useMutation({
    mutationFn: () => unwrap(landWatchService.reinspect(i.id, reason.trim())),
    onSuccess: (d) => {
      setAsking(false);
      setReason('');
      onSaved(d, 'Reinspection requested.');
    },
    onError: (e) => onFailed(e, 'Could not request a reinspection.'),
  });
  const r = i.report;
  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {LAND_INSPECTION_KIND_LABELS[i.kind]} · <span className="font-mono">{i.reference}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {i.inspector ? `${i.inspector.name} · ` : ''}
            {r?.submittedAt
              ? `visited ${formatDate(r.submittedAt)}`
              : `requested ${formatDate(i.createdAt)}`}
          </p>
        </div>
        {r?.boundaryCondition ? (
          <Badge variant={boundaryTone(r.boundaryCondition)}>
            {LAND_BOUNDARY_LABELS[r.boundaryCondition]}
          </Badge>
        ) : (
          <Badge variant="neutral">{LAND_INSPECTION_STATUS_LABELS[i.status]}</Badge>
        )}
      </div>
      {r && (
        <>
          {r.beaconsExpected != null && (
            <p className="mt-2 text-sm text-foreground">
              Beacons found: {r.beaconsFound ?? '—'} of {r.beaconsExpected}
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.summary}</p>
          {r.staffNote && (
            <p className="mt-1 text-xs text-muted-foreground">GetRentos: {r.staffNote}</p>
          )}
          {r.evidence.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {r.evidence.map((e) => (
                <li key={e.id}>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="block">
                    {e.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.url}
                        alt={e.note ?? e.fileName}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex aspect-square items-center justify-center rounded-lg bg-secondary p-2 text-center text-xs">
                        {e.fileName}
                      </span>
                    )}
                  </a>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                    {formatDate(e.capturedAt)}
                    {e.distanceM != null &&
                      (e.distanceM === 0 ? ' · on the land' : ` · ${e.distanceM} m away`)}
                    {e.capturedOffline && ' · captured offline'}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {i.status === 'ACCEPTED' &&
            (asking ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="What should the inspector look at again?"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={reason.trim().length < 10 || reinspect.isPending}
                    isLoading={reinspect.isPending}
                    onClick={() => reinspect.mutate()}
                  >
                    Request reinspection
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="mt-3" size="sm" variant="outline" onClick={() => setAsking(true)}>
                Ask for a second look
              </Button>
            ))}
        </>
      )}
    </li>
  );
};

const INCIDENT_KINDS: LandWatchIncidentKind[] = [
  'ENCROACHMENT',
  'BOUNDARY_DISTURBANCE',
  'CONSTRUCTION',
  'DUMPING',
  'GOVERNMENT_NOTICE',
  'OTHER',
];

const IncidentsCard = ({ watch, onSaved, onFailed }: SectionProps) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LandWatchIncidentKind | ''>('');
  const [description, setDescription] = useState('');
  const [requestInspection, setRequestInspection] = useState(true);
  const report = useMutation({
    mutationFn: () =>
      unwrap(
        landWatchService.reportIncident(watch.id, {
          kind: kind as LandWatchIncidentKind,
          description: description.trim(),
          requestInspection,
        })
      ),
    onSuccess: (d) => {
      setOpen(false);
      setKind('');
      setDescription('');
      onSaved(d, 'Reported. GetRentos will look into it.');
    },
    onError: (e) => onFailed(e, 'Could not report that.'),
  });
  return (
    <Card static className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" /> Incidents
      </h2>
      {watch.incidents.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing reported.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {watch.incidents.map((i) => (
            <li key={i.id} className="text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {LAND_INCIDENT_KIND_LABELS[i.kind]}
                </span>
                <Badge
                  variant={
                    i.status === 'OPEN'
                      ? 'warning'
                      : i.status === 'DISMISSED'
                        ? 'neutral'
                        : 'danger'
                  }
                >
                  {LAND_INCIDENT_STATUS_LABELS[i.status]}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{i.description}</p>
              {i.resolutionNote && (
                <p className="mt-1 text-foreground">GetRentos: {i.resolutionNote}</p>
              )}
              {i.disputeId && (
                <Link
                  href="/land/disputes"
                  className="mt-1 inline-block text-primary hover:underline"
                >
                  See the dispute
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {watch.status !== 'CANCELLED' &&
        (open ? (
          <div className="mt-4 space-y-3">
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as LandWatchIncidentKind)}
              ariaLabel="What happened"
              placeholder="What happened"
              options={INCIDENT_KINDS.map((k) => ({
                value: k,
                label: LAND_INCIDENT_KIND_LABELS[k],
              }))}
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="What you saw or were told, and when"
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={requestInspection}
                onChange={(e) => setRequestInspection(e.target.checked)}
              />
              Send an inspector to look
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!kind || description.trim().length < 10 || report.isPending}
                isLoading={report.isPending}
                onClick={() => report.mutate()}
              >
                Report
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-4" size="sm" variant="outline" onClick={() => setOpen(true)}>
            Report a problem
          </Button>
        ))}
    </Card>
  );
};

const REMINDER_KINDS: LandWatchReminderKind[] = [
  'LAND_USE_CHARGE',
  'GROUND_RENT',
  'TENEMENT_RATE',
  'PERFECTION_STEP',
  'OTHER',
];

const RemindersCard = ({ watch, onSaved, onFailed }: SectionProps) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LandWatchReminderKind>('LAND_USE_CHARGE');
  const [label, setLabel] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [annual, setAnnual] = useState(true);
  const add = useMutation({
    mutationFn: () =>
      unwrap(
        landWatchService.addReminder(watch.id, {
          kind,
          label: label.trim() || LAND_REMINDER_KIND_LABELS[kind],
          dueDate,
          annual,
          amountNaira: amount ? Number(amount) : undefined,
        })
      ),
    onSuccess: (d) => {
      setOpen(false);
      setLabel('');
      setDueDate('');
      setAmount('');
      onSaved(d, 'Reminder added. We will remind you 30 and 7 days before, and on the day.');
    },
    onError: (e) => onFailed(e, 'Could not add the reminder.'),
  });
  const paid = useMutation({
    mutationFn: (reminderId: string) => unwrap(landWatchService.reminderPaid(watch.id, reminderId)),
    onSuccess: (d) => onSaved(d, 'Marked paid.'),
    onError: (e) => onFailed(e, 'Could not update the reminder.'),
  });
  const remove = useMutation({
    mutationFn: (reminderId: string) =>
      unwrap(landWatchService.removeReminder(watch.id, reminderId)),
    onSuccess: (d) => onSaved(d, 'Reminder removed.'),
    onError: (e) => onFailed(e, 'Could not remove the reminder.'),
  });
  return (
    <Card static className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <BellRing className="h-5 w-5 text-primary" aria-hidden="true" /> Reminders
      </h2>
      {watch.reminders.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Add land use charge, ground rent or any date you must not miss.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {watch.reminders.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">{r.label}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(r.dueDate)}
                  {r.annual ? ' · yearly' : ''}
                  {r.amountNaira != null ? ` · ${formatCurrency(r.amountNaira)}` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => paid.mutate(r.id)}
                  isLoading={paid.isPending && paid.variables === r.id}
                >
                  Paid
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {watch.status !== 'CANCELLED' &&
        (open ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Kind">
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as LandWatchReminderKind)}
                ariaLabel="Kind"
                options={REMINDER_KINDS.map((k) => ({
                  value: k,
                  label: LAND_REMINDER_KIND_LABELS[k],
                }))}
              />
            </Field>
            <Field label="Name">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={LAND_REMINDER_KIND_LABELS[kind]}
                maxLength={120}
              />
            </Field>
            <Field label="Due" required>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Amount (₦)">
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
              <input
                type="checkbox"
                checked={annual}
                onChange={(e) => setAnnual(e.target.checked)}
              />
              Every year
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button
                size="sm"
                disabled={!dueDate || add.isPending}
                isLoading={add.isPending}
                onClick={() => add.mutate()}
              >
                Add reminder
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-4" size="sm" variant="outline" onClick={() => setOpen(true)}>
            Add a reminder
          </Button>
        ))}
    </Card>
  );
};
