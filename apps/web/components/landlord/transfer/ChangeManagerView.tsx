'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, CalendarClock, TriangleAlert } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  DatePicker,
  EmptyState,
  Field,
  ListSkeleton,
  RadioGroup,
  Select,
  Skeleton,
  Textarea,
} from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { landlordService } from '@/services/landlordService';
import { vettedFirms } from '@/services/mandateService';
import {
  managementTransferService,
  type ManagementTransfer,
} from '@/services/managementTransferService';

type Incoming = { kind: 'GETRENTOS' } | { kind: 'FIRM'; id: string } | { kind: 'SELF' };

const STATUS: Record<
  ManagementTransfer['status'],
  { label: string; variant: 'info' | 'success' | 'neutral' | 'warning' | 'danger' }
> = {
  OPEN: { label: 'Scheduled', variant: 'info' },
  SWITCHED: { label: 'Taken effect', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Called off', variant: 'neutral' },
  DISPUTED: { label: 'Disputed', variant: 'danger' },
};

/** Today in Lagos, as YYYY-MM-DD. */
const lagosToday = () => new Date(Date.now() + 60 * 60_000).toISOString().slice(0, 10);

/**
 * Changing who manages a property: from the current manager (or from managing
 * it yourself) to a verified firm, GetRentos Managed, or back to you, at a time
 * you choose. The current manager runs it until then; at that time their access
 * ends, the new manager's begins, and every tenant is told.
 */
export function ChangeManagerView() {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [fromMandateId, setFromMandateId] = useState<string>('');
  const [incoming, setIncoming] = useState<Incoming>({ kind: 'GETRENTOS' });
  const [when, setWhen] = useState<'ASAP' | 'DATE'>('DATE');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [acknowledge, setAcknowledge] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const properties = useQuery({
    queryKey: ['landlord', 'properties', 'all'],
    queryFn: () => unwrap(landlordService.listProperties({ pageSize: 100 })),
  });
  const preview = useQuery({
    queryKey: ['management-transfer', 'preview', propertyId],
    enabled: !!propertyId,
    queryFn: () => unwrap(managementTransferService.preview(propertyId)),
  });
  const firms = useQuery({ queryKey: ['vetted-firms'], queryFn: () => unwrap(vettedFirms()) });
  const transfers = useQuery({
    queryKey: ['management-transfers', 'mine'],
    queryFn: () => unwrap(managementTransferService.mine()),
  });

  const p = preview.data;
  const outgoing = p?.running.find((r) => r.mandateId === fromMandateId) ?? null;
  const effectiveAt =
    when === 'ASAP' ? new Date().toISOString() : date ? `${date}T00:00:00+01:00` : '';
  const early = outgoing && effectiveAt && new Date(effectiveAt) < new Date(outgoing.noticeEndsAt);

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        managementTransferService.request({
          propertyId,
          fromMandateId: fromMandateId || undefined,
          incomingIsGetRentos: incoming.kind === 'GETRENTOS' || undefined,
          incomingOrganizationId: incoming.kind === 'FIRM' ? incoming.id : undefined,
          effectiveAt,
          reason: reason.trim() || undefined,
          acknowledgeOpenItems: acknowledge || undefined,
        })
      ),
    onSuccess: (t) => {
      setMessage({
        ok: true,
        text:
          t.status === 'SWITCHED'
            ? `${t.propertyName} is now managed by ${t.incoming.manager}.`
            : `Scheduled: ${t.propertyName} moves to ${t.incoming.manager} on ${formatDate(t.effectiveAt)}. Until then nothing changes.`,
      });
      setPropertyId('');
      setFromMandateId('');
      setReason('');
      setAcknowledge(false);
      queryClient.invalidateQueries({ queryKey: ['management-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['management-transfer'] });
    },
    onError: (e: Error) => setMessage({ ok: false, text: e.message }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => unwrap(managementTransferService.cancel(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['management-transfers'] }),
    onError: (e: Error) => setMessage({ ok: false, text: e.message }),
  });

  const blocked =
    !propertyId ||
    !effectiveAt ||
    // A property already under management changes hands: say which engagement ends.
    (!!p?.running.length && !fromMandateId) ||
    (incoming.kind === 'SELF' && !fromMandateId) ||
    (incoming.kind === 'FIRM' && !incoming.id) ||
    (!!p?.openItems.length && !acknowledge) ||
    !!p?.openTransferId;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ArrowRightLeft className="h-6 w-6 text-primary" aria-hidden /> Change manager
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Move a property to a verified firm, to GetRentos Managed, or back to yourself. The current
          manager runs it until the date you choose; then their access ends, the new manager&apos;s
          begins, and every tenant is told. Rent keeps going through GetRentos throughout.
        </p>
      </div>

      <Card className="space-y-5 p-5">
        <Field label="Property">
          <Select
            value={propertyId}
            onValueChange={(value) => {
              setPropertyId(value);
              setFromMandateId('');
              setAcknowledge(false);
              setMessage(null);
            }}
            placeholder="Choose a property…"
            options={(properties.data?.items ?? []).map((pr) => ({ value: pr.id, label: pr.name }))}
          />
        </Field>

        {propertyId && preview.isLoading && (
          <div role="status" aria-label="Checking" className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {preview.isError && !p && (
          <Alert variant="danger">{(preview.error as Error).message}</Alert>
        )}

        {p && (
          <>
            {p.openTransferId && (
              <Alert variant="warning">
                A change of manager is already scheduled for this property. Call it off below to set
                up a different one.
              </Alert>
            )}

            <div>
              <p className="text-sm font-medium text-foreground">Managed now by</p>
              {p.running.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">You manage it yourself.</p>
              ) : (
                <div className="mt-2">
                  <RadioGroup
                    variant="card"
                    aria-label="Managed now by"
                    value={fromMandateId}
                    onValueChange={(mandateId) => {
                      setFromMandateId(mandateId);
                      const r = p.running.find((item) => item.mandateId === mandateId);
                      if (r?.managerIsGetRentos && incoming.kind === 'GETRENTOS')
                        setIncoming({ kind: 'FIRM', id: '' });
                    }}
                    options={p.running.map((r) => ({
                      value: r.mandateId,
                      label: r.manager,
                      description: `${r.scope.map((s) => s.toLowerCase()).join(', ')} · ${r.noticePeriodDays} days’ notice, ending ${formatDate(r.noticeEndsAt)} if given today`,
                    }))}
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Who takes over</p>
              <div className="mt-2">
                <RadioGroup
                  variant="card"
                  orientation="horizontal"
                  columns={3}
                  aria-label="Who takes over"
                  value={incoming.kind}
                  onValueChange={(kind) =>
                    setIncoming(kind === 'FIRM' ? { kind, id: '' } : ({ kind } as Incoming))
                  }
                  options={[
                    {
                      value: 'GETRENTOS',
                      label: 'GetRentos Managed',
                      // You cannot move a property to the manager you are ending.
                      disabled: !!outgoing?.managerIsGetRentos,
                    },
                    { value: 'FIRM', label: 'A verified firm' },
                    { value: 'SELF', label: 'Me' },
                  ]}
                />
              </div>
              {incoming.kind === 'FIRM' && (
                <div className="mt-2">
                  <Select
                    ariaLabel="Firm"
                    value={incoming.id}
                    onValueChange={(id) => setIncoming({ kind: 'FIRM', id })}
                    placeholder="Choose a verified firm…"
                    options={(firms.data ?? []).map((f) => ({
                      value: f.id,
                      label: `${f.name} · ${f.activeEngagements} active engagement${f.activeEngagements === 1 ? '' : 's'}`,
                    }))}
                  />
                </div>
              )}
              {incoming.kind === 'SELF' && !fromMandateId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Choose the engagement you are ending above.
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">When</p>
              <div className="mt-2">
                <RadioGroup
                  orientation="horizontal"
                  aria-label="When"
                  value={when}
                  onValueChange={(value) => setWhen(value)}
                  options={[
                    { value: 'DATE', label: 'On a date' },
                    { value: 'ASAP', label: 'Straight away' },
                  ]}
                />
              </div>
              {when === 'DATE' && (
                <div className="mt-2 max-w-xs">
                  <DatePicker
                    value={date}
                    onChange={setDate}
                    min={lagosToday()}
                    ariaLabel="Change date"
                  />
                </div>
              )}
              {early && (
                <p className="mt-2 text-xs text-warning">
                  This is before the end of {outgoing?.manager}&apos;s notice period (
                  {formatDate(outgoing!.noticeEndsAt)}).{' '}
                  {outgoing?.managerIsGetRentos
                    ? 'GetRentos charges notice in lieu for an early end.'
                    : 'Check your agreement with them for early-exit terms.'}
                </p>
              )}
            </div>

            <Field label="Reason" optionalLabel="(optional)">
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>

            {p.openItems.length > 0 && (
              <Alert variant="warning" icon={TriangleAlert} title="Open on this property">
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {p.openItems.map((i) => (
                    <li key={`${i.kind}-${i.id}`}>{i.label}</li>
                  ))}
                </ul>
                <Checkbox
                  className="mt-3"
                  checked={acknowledge}
                  onCheckedChange={setAcknowledge}
                  label="I’ve seen these. They carry over and are settled with the handover."
                />
              </Alert>
            )}

            <Button
              variant="primary"
              disabled={blocked}
              isLoading={submit.isPending}
              loadingText="Scheduling…"
              onClick={() => submit.mutate()}
            >
              Schedule change of manager
            </Button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be asked to confirm it&apos;s you.
            </p>
          </>
        )}

        {message && <Alert variant={message.ok ? 'success' : 'danger'}>{message.text}</Alert>}
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <CalendarClock className="h-5 w-5 text-primary" aria-hidden /> Changes of manager
        </h2>
        {transfers.isLoading ? (
          <ListSkeleton rows={2} className="mt-3" />
        ) : !transfers.data?.length ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="None yet."
            size="compact"
            bare
            className="mt-2"
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {transfers.data.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{t.propertyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.outgoing ? `${t.outgoing.manager} → ` : 'You → '}
                      {t.incoming.manager} · {formatDate(t.effectiveAt)}
                    </p>
                    {t.status === 'OPEN' && (
                      <p className="text-xs text-muted-foreground">
                        {t.incoming.ready
                          ? 'The new manager is set up and starts on the date.'
                          : t.incoming.manager === 'the owner'
                            ? 'You take over on the date.'
                            : 'Waiting for the new manager’s engagement to be set up.'}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS[t.status].variant}>{STATUS[t.status].label}</Badge>
                    {t.status !== 'OPEN' && t.status !== 'CANCELLED' && (
                      <Link
                        href={`/landlord/change-manager/${t.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Handover
                      </Link>
                    )}
                    {t.status === 'OPEN' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={cancel.isPending && cancel.variables !== t.id}
                        isLoading={cancel.isPending && cancel.variables === t.id}
                        aria-label={`Call off the change for ${t.propertyName}`}
                        onClick={() => cancel.mutate(t.id)}
                      >
                        Call off
                      </Button>
                    )}
                  </div>
                </div>
                {t.switchLog.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {t.switchLog.map((l) => (
                      <li key={l.step} className={l.ok ? '' : 'text-destructive'}>
                        {l.ok ? '✓' : '✗'} {l.note}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
