'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation } from 'lucide-react';
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  DatePicker,
  EmptyState,
  Field,
  Input,
  PageErrorState,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  TimePicker,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';

import {
  adminFieldService,
  adminManagedService,
  type FieldAgent,
  type FieldVisit,
} from '@/services/adminManagedService';
import { adminService } from '@/services/adminService';
import { FieldAssigneeSelect } from '@/components/admin/managed/FieldAssigneeSelect';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';

type Tab = 'mine' | 'open' | 'overdue' | 'done' | 'team';

const lagosDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const STATUS: Record<FieldVisit['status'], { label: string; variant: BadgeVariant }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'info' },
  CHECKED_IN: { label: 'On site', variant: 'success' },
  DONE: { label: 'Done', variant: 'neutral' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
};

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'field'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-intakes'] });
  };
};

/** Where a check-in put the agent, in words. */
const presence = (v: FieldVisit) => {
  if (!v.checkedInAt) return null;
  if (v.checkInDistanceM === null)
    return 'Checked in; the property has no map pin to measure against.';
  return `Checked in ${lagosDateTime(v.checkedInAt)}, ${v.checkInDistanceM} m from the pin${
    v.checkInWithinRange ? '' : ' (not on site)'
  }.`;
};

/** The browser's best position fix, as a promise. */
const currentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This device cannot share its location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => reject(new Error(err.message)), {
      enableHighAccuracy: true,
      timeout: 20_000,
      maximumAge: 0,
    });
  });

const VisitCard = ({
  visit,
  mode,
  canOperate,
  staffOptions,
}: {
  visit: FieldVisit;
  mode: 'mine' | 'ops';
  canOperate: boolean;
  staffOptions: { value: string; label: string }[];
}) => {
  const invalidate = useInvalidate();
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const onError = (err: Error) => setError(err.message || 'That did not go through.');
  const onSuccess = () => {
    setError(null);
    invalidate();
  };

  const checkIn = useMutation({
    mutationFn: async () => {
      const pos = await currentPosition();
      return unwrap(
        adminFieldService.checkIn(visit.id, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        })
      );
    },
    onSuccess,
    onError,
  });
  const complete = useMutation({
    mutationFn: () => unwrap(adminFieldService.complete(visit.id, outcome.trim())),
    onSuccess,
    onError,
  });
  const reassign = useMutation({
    mutationFn: () => unwrap(adminFieldService.reassign(visit.id, reassignTo)),
    onSuccess,
    onError,
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(adminFieldService.cancel(visit.id, cancelReason.trim())),
    onSuccess,
    onError,
  });

  const open = visit.status === 'SCHEDULED' || visit.status === 'CHECKED_IN';
  const status = STATUS[visit.status];
  const proof = presence(visit);

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{visit.propertyTitle}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {visit.propertyAddress}
            {!visit.propertyHasPin && ' · no map pin'}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {visit.kind === 'ASSESSMENT' ? 'Site assessment' : 'Inspection'} ·{' '}
            {lagosDateTime(visit.scheduledFor)}
            {mode === 'ops' && <> · {visit.assigneeName ?? 'staff'}</>}
          </p>
          {visit.purpose && <p className="mt-0.5 text-sm text-foreground">{visit.purpose}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={status.variant}>{status.label}</Badge>
          {visit.overdue && <Badge variant="danger">Overdue</Badge>}
        </div>
      </div>

      {proof && (
        <p
          className={`text-sm ${visit.checkInWithinRange === false ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {proof}
        </p>
      )}
      {visit.outcomeNote && (
        <p className="text-sm text-muted-foreground">
          Outcome: <span className="text-foreground">{visit.outcomeNote}</span>
        </p>
      )}
      {visit.cancelReason && (
        <p className="text-sm text-muted-foreground">Cancelled: {visit.cancelReason}</p>
      )}

      {mode === 'mine' && visit.status === 'SCHEDULED' && (
        <div className="border-t border-border pt-3">
          <Button isLoading={checkIn.isPending} onClick={() => checkIn.mutate()}>
            <Navigation className="mr-1.5 h-4 w-4" aria-hidden />
            Check in here
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Uses this device&rsquo;s location once. GetRentos keeps only your distance from the
            property and a position rounded to about 100 m.
          </p>
        </div>
      )}

      {mode === 'mine' && open && visit.kind === 'INSPECTION' && (
        <div className="border-t border-border pt-3">
          <Textarea
            rows={2}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="What you found. At least 10 characters."
          />
          <Button
            className="mt-2"
            variant="outline"
            isLoading={complete.isPending}
            disabled={outcome.trim().length < 10}
            onClick={() => complete.mutate()}
          >
            Close visit
          </Button>
        </div>
      )}
      {mode === 'mine' && open && visit.kind === 'ASSESSMENT' && (
        <p className="border-t border-border pt-3 text-sm text-muted-foreground">
          Record the assessment in Managed intake to close this visit.
        </p>
      )}

      {mode === 'ops' && canOperate && visit.status === 'SCHEDULED' && (
        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center">
          <div className="sm:w-80">
            <FieldAssigneeSelect
              ariaLabel={`Reassign ${visit.propertyTitle}`}
              propertyId={visit.propertyId}
              value={reassignTo}
              onValueChange={setReassignTo}
              staffOptions={staffOptions}
            />
          </div>
          <Button
            variant="outline"
            isLoading={reassign.isPending}
            disabled={!reassignTo}
            onClick={() => reassign.mutate()}
          >
            Reassign
          </Button>
        </div>
      )}
      {mode === 'ops' && canOperate && open && visit.kind === 'INSPECTION' && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason to cancel"
            className="sm:w-80"
          />
          <Button
            variant="ghost"
            isLoading={cancel.isPending}
            disabled={cancelReason.trim().length < 5}
            onClick={() => cancel.mutate()}
          >
            Cancel visit
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  );
};

const BookInspection = ({ staffOptions }: { staffOptions: { value: string; label: string }[] }) => {
  const invalidate = useInvalidate();
  const managed = useQuery({
    queryKey: ['admin', 'field', 'managed-properties'],
    queryFn: () => unwrap(adminManagedService.listActive()),
  });
  const [propertyId, setPropertyId] = useState('');
  const [assignee, setAssignee] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);

  const propertyOptions = useMemo(() => {
    const seen = new Set<string>();
    return (managed.data ?? [])
      .filter((m) => m.status === 'ACTIVE' && !seen.has(m.propertyId) && seen.add(m.propertyId))
      .map((m) => ({ value: m.propertyId, label: m.propertyTitle ?? 'Property' }));
  }, [managed.data]);

  const book = useMutation({
    mutationFn: () =>
      unwrap(
        adminFieldService.scheduleInspection({
          propertyId,
          assigneeUserId: assignee,
          scheduledFor: `${date}T${time}:00+01:00`,
          purpose: purpose.trim(),
        })
      ),
    onSuccess: () => {
      setError(null);
      setPurpose('');
      setAssignee('');
      invalidate();
    },
    onError: (err: Error) => setError(err.message || 'Could not book the visit.'),
  });

  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold text-foreground">Book an inspection</h2>
      <p className="text-sm text-muted-foreground">
        For a property GetRentos manages now. Assessments for new requests are booked from Managed
        intake.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          ariaLabel="Property"
          value={propertyId}
          onValueChange={(v) => {
            setPropertyId(v);
            setAssignee('');
          }}
          options={[{ value: '', label: 'Choose a managed property…' }, ...propertyOptions]}
        />
        {propertyId ? (
          <FieldAssigneeSelect
            ariaLabel="Who goes"
            propertyId={propertyId}
            value={assignee}
            onValueChange={setAssignee}
            staffOptions={staffOptions}
          />
        ) : (
          <div />
        )}
        <DatePicker value={date} onChange={setDate} min={new Date().toISOString().slice(0, 10)} />
        <TimePicker value={time} onChange={setTime} minHour={7} maxHour={19} />
      </div>
      <Input
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="What the visit is for, e.g. quarterly condition check"
      />
      <Button
        isLoading={book.isPending}
        disabled={!propertyId || !assignee || !date || !time || purpose.trim().length < 5}
        onClick={() => book.mutate()}
      >
        Book visit
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  );
};

const AgentRow = ({ agent, canOperate }: { agent: FieldAgent; canOperate: boolean }) => {
  const invalidate = useInvalidate();
  const [states, setStates] = useState(agent.states.join(', '));
  const [areas, setAreas] = useState(agent.areas.join(', '));
  const [limit, setLimit] = useState(String(agent.maxOpenVisits));
  const [active, setActive] = useState(agent.active ? 'yes' : 'no');
  const [error, setError] = useState<string | null>(null);
  const split = (v: string) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        adminFieldService.saveAgent(agent.userId, {
          states: split(states),
          areas: split(areas),
          maxOpenVisits: Number(limit),
          active: active === 'yes',
        })
      ),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err: Error) => setError(err.message || 'Could not save.'),
  });

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{agent.name ?? 'Staff member'}</h3>
          <p className="text-sm text-muted-foreground">{agent.email}</p>
        </div>
        <div className="text-right">
          <Badge variant={agent.openVisits >= agent.maxOpenVisits ? 'danger' : 'info'}>
            {agent.openVisits}/{agent.maxOpenVisits} open
          </Badge>
          {!agent.active && <p className="mt-1 text-xs text-muted-foreground">Not taking visits</p>}
        </div>
      </div>
      {canOperate && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="States" className="sm:col-span-1">
              <Input value={states} onChange={(e) => setStates(e.target.value)} className="mt-1" />
            </Field>
            <Field label="Areas (blank = whole state)" className="sm:col-span-2">
              <Input
                value={areas}
                onChange={(e) => setAreas(e.target.value)}
                placeholder="Lekki, Ikoyi, Ikate"
                className="mt-1"
              />
            </Field>
            <Field label="Open visit limit">
              <Input
                inputMode="numeric"
                value={limit}
                onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))}
                className="mt-1"
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                ariaLabel="Taking visits"
                value={active}
                onValueChange={setActive}
                options={[
                  { value: 'yes', label: 'Taking visits' },
                  { value: 'no', label: 'Not taking visits' },
                ]}
              />
            </div>
            <Button
              variant="outline"
              isLoading={save.isPending}
              disabled={!states.trim() || !Number(limit)}
              onClick={() => save.mutate()}
            >
              Save
            </Button>
          </div>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  );
};

const FieldTeam = ({
  canOperate,
  staffOptions,
}: {
  canOperate: boolean;
  staffOptions: { value: string; label: string }[];
}) => {
  const invalidate = useInvalidate();
  const agents = useQuery({
    queryKey: ['admin', 'field', 'agents'],
    queryFn: () => unwrap(adminFieldService.agents()),
  });
  const [adding, setAdding] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: () =>
      unwrap(
        adminFieldService.saveAgent(adding, {
          states: ['Lagos'],
          areas: [],
          maxOpenVisits: 6,
          active: true,
        })
      ),
    onSuccess: () => {
      setAdding('');
      setError(null);
      invalidate();
    },
    onError: (err: Error) => setError(err.message || 'Could not add them.'),
  });
  const onTeam = new Set((agents.data ?? []).map((a) => a.userId));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Who goes out to properties, where they cover and how many open visits they can carry.
        Bookings suggest whoever covers the area and has the most room, and refuse anyone at their
        limit.
      </p>
      {canOperate && (
        <Card className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <div className="sm:w-96">
            <Select
              ariaLabel="Add to field team"
              value={adding}
              onValueChange={setAdding}
              options={[
                { value: '', label: 'Add a staff member…' },
                ...staffOptions.filter((o) => !onTeam.has(o.value)),
              ]}
            />
          </div>
          <Button isLoading={add.isPending} disabled={!adding} onClick={() => add.mutate()}>
            Add to field team
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Card>
      )}
      {agents.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (agents.data ?? []).length === 0 ? (
        <EmptyState
          icon={Navigation}
          title="No field team yet"
          description="Add staff who visit properties. Until then, any staff member can be booked."
        />
      ) : (
        (agents.data ?? []).map((agent) => (
          <AgentRow key={agent.userId} agent={agent} canOperate={canOperate} />
        ))
      )}
    </div>
  );
};

export default function FieldOperationsPage() {
  const user = useAdminUser();
  const canOperate = hasAdminPermission(user?.roles, 'managed.operate');
  const [tab, setTab] = useState<Tab>('mine');

  const staff = useQuery({
    queryKey: ['admin', 'staff', 'for-managed'],
    queryFn: () => unwrap(adminService.listStaff({ pageSize: 100 })),
  });
  const staffOptions = useMemo(
    () =>
      (staff.data?.items ?? []).map((member) => ({
        value: member.id,
        label: member.email ? `${member.legalName} · ${member.email}` : member.legalName,
      })),
    [staff.data]
  );

  const visits = useQuery({
    queryKey: ['admin', 'field', 'visits', tab],
    queryFn: () =>
      unwrap(
        tab === 'mine'
          ? adminFieldService.mine()
          : adminFieldService.visits(tab as 'open' | 'overdue' | 'done')
      ),
    enabled: tab !== 'team',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Navigation className="h-6 w-6 text-primary" aria-hidden />
          Field operations
        </h1>
        <p className="mt-1 text-muted-foreground">
          Site visits for GetRentos Managed: who is going where, proof they were there, and what is
          overdue.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="mine">My visits</TabsTrigger>
          <TabsTrigger value="open">All open</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
          <TabsTrigger value="team">Field team</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'team' ? (
        <FieldTeam canOperate={canOperate} staffOptions={staffOptions} />
      ) : (
        <>
          {tab === 'open' && canOperate && <BookInspection staffOptions={staffOptions} />}
          {visits.isError ? (
            <PageErrorState
              title="Could not load visits"
              description={(visits.error as Error).message}
              onRetry={() => void visits.refetch()}
            />
          ) : visits.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (visits.data ?? []).length === 0 ? (
            <EmptyState
              icon={MapPin}
              title={tab === 'mine' ? 'No visits for you' : 'Nothing here'}
              description={
                tab === 'overdue'
                  ? 'Every visit has been checked in on time.'
                  : 'Visits appear here as they are booked.'
              }
            />
          ) : (
            <div className="space-y-4">
              {(visits.data ?? []).map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  mode={tab === 'mine' ? 'mine' : 'ops'}
                  canOperate={canOperate}
                  staffOptions={staffOptions}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
