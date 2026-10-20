'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Download, FileCheck2, TriangleAlert } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  Field,
  Input,
  PageErrorState,
  Select,
  Textarea,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import {
  managementTransferService,
  type DepositTreatment,
  type Handover,
} from '@/services/managementTransferService';

const TREATMENT: Record<DepositTreatment, string> = {
  HANDED_TO_INCOMING: 'Handed to the incoming manager',
  RETURNED_TO_TENANT: 'Returned to the tenant',
  PAID_TO_GETRENTOS: 'Paid to GetRentos',
};

/**
 * The handover pack for a change of manager: the property's state when the
 * change took effect, and where the sign-off stands. Each party signs the same
 * frozen pack (its hash), or disputes it instead.
 */
export function HandoverView({ transferId }: { transferId: string }) {
  const queryClient = useQueryClient();
  const [keys, setKeys] = useState('');
  const [deposits, setDeposits] = useState<
    Record<string, { treatment?: DepositTreatment; note: string }>
  >({});
  const [disputeText, setDisputeText] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['handover', transferId],
    queryFn: () => unwrap(managementTransferService.handover(transferId)),
  });
  const done = (h: Handover) => {
    setError(null);
    queryClient.setQueryData(['handover', transferId], { ...q.data, ...h });
    queryClient.invalidateQueries({ queryKey: ['management-transfers'] });
  };
  const fail = (e: Error) => setError(e.message);

  const h = q.data;
  const pack = h?.pack;
  const snap = pack?.snapshot;
  const outside = (snap?.leases ?? []).flatMap((l) =>
    l.deposit && !l.deposit.heldByGetRentos
      ? [{ ...l.deposit, tenant: l.tenant, unit: l.unit }]
      : []
  );

  const signOutgoing = useMutation({
    mutationFn: () =>
      unwrap(
        managementTransferService.signOutgoing(transferId, {
          hash: pack!.hash,
          keysDeclaration: keys.trim(),
          deposits: outside.map((d) => ({
            depositHoldId: d.id,
            treatment: deposits[d.id]!.treatment!,
            note: deposits[d.id]?.note.trim() || undefined,
          })),
        })
      ),
    onSuccess: done,
    onError: fail,
  });
  const sign = useMutation({
    mutationFn: (side: 'owner' | 'incoming') =>
      unwrap(managementTransferService.sign(transferId, side, pack!.hash)),
    onSuccess: done,
    onError: fail,
  });
  const dispute = useMutation({
    mutationFn: () => unwrap(managementTransferService.dispute(transferId, disputeText.trim())),
    onSuccess: (r) => {
      setShowDispute(false);
      done(r);
    },
    onError: fail,
  });
  const exportPack = useMutation({
    mutationFn: () => unwrap(managementTransferService.exportHandover(transferId)),
    onSuccess: (data) => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `handover-${transferId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: fail,
  });

  if (q.isLoading)
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={6} />
      </div>
    );
  if (q.isError && !q.data)
    return (
      <PageErrorState
        description={(q.error as Error).message}
        onRetry={() => void q.refetch()}
        isRetrying={q.isFetching}
      />
    );
  if (!h || !pack || !snap) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        The handover pack is made when the change of manager takes effect.
      </p>
    );
  }

  const v = h.viewer;
  const open = h.status === 'SWITCHED';
  const canOutgoing = open && v?.isOutgoing && !pack.outgoingSignedAt;
  const waitingOnOutgoing = h.required.outgoing && !pack.outgoingSignedAt;
  const canOwner = open && v?.isOwner && !pack.ownerSignedAt && !waitingOnOutgoing;
  const canIncoming = open && v?.isIncoming && !pack.incomingSignedAt && !waitingOnOutgoing;
  const outgoingReady = keys.trim().length >= 10 && outside.every((d) => deposits[d.id]?.treatment);

  const steps = [
    ...(h.required.outgoing
      ? [{ label: `${snap.outgoing ?? 'Outgoing manager'} signs`, at: pack.outgoingSignedAt }]
      : []),
    { label: 'Owner acknowledges', at: pack.ownerSignedAt },
    ...(h.required.incoming
      ? [{ label: `${snap.incoming} accepts`, at: pack.incomingSignedAt }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FileCheck2 className="h-6 w-6 text-primary" aria-hidden /> Handover:{' '}
            {snap.property.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {snap.outgoing ?? 'The owner'} → {snap.incoming}, as at {formatDate(snap.asOf)}. Pack{' '}
            <span className="font-mono">{pack.hash.slice(0, 12)}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              h.status === 'COMPLETED' ? 'success' : h.status === 'DISPUTED' ? 'danger' : 'info'
            }
          >
            {h.status === 'COMPLETED'
              ? 'Completed'
              : h.status === 'DISPUTED'
                ? 'Disputed'
                : 'Signing'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="h-3.5 w-3.5" />}
            isLoading={exportPack.isPending}
            onClick={() => exportPack.mutate()}
          >
            Export
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-foreground">Sign-off</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              {s.at ? (
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
              <span className={s.at ? 'text-foreground' : 'text-muted-foreground'}>
                {s.label}
                {s.at ? ` · ${formatDate(s.at)}` : ''}
              </span>
            </li>
          ))}
        </ol>
        {pack.disputeReason && (
          <div
            className={`mt-3 rounded-lg p-3 text-sm ${h.status === 'DISPUTED' ? 'bg-warning-subtle' : 'bg-secondary/60'}`}
          >
            <p className="flex items-center gap-2 font-medium text-foreground">
              <TriangleAlert className="h-4 w-4 text-warning" aria-hidden /> Disputed
              {pack.disputedAt ? ` ${formatDate(pack.disputedAt)}` : ''}: {pack.disputeReason}
            </p>
            {pack.disputeResolution ? (
              <p className="mt-1 text-muted-foreground">
                Settled by GetRentos: {pack.disputeResolution}
              </p>
            ) : (
              <p className="mt-1 text-muted-foreground">
                GetRentos ops will settle it before sign-off resumes.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-foreground">Money at handover</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Rent owed by tenants</dt>
            <dd className="font-medium text-foreground">{formatCurrency(snap.totals.arrears)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rent held for the owner</dt>
            <dd className="font-medium text-foreground">
              {formatCurrency(snap.totals.heldForOwner)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tenant credit</dt>
            <dd className="font-medium text-foreground">{formatCurrency(snap.totals.credit)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Deposits held by GetRentos</dt>
            <dd className="font-medium text-foreground">
              {formatCurrency(snap.totals.depositsWithGetRentos)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Deposits held outside GetRentos</dt>
            <dd className="font-medium text-foreground">
              {formatCurrency(snap.totals.depositsOutside)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Owner&apos;s money with GetRentos</dt>
            <dd className="font-medium text-foreground">
              {formatCurrency(snap.ownerMoney.heldByGetRentos)}
            </dd>
          </div>
        </dl>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-3 font-medium">Tenancy</th>
                <th className="py-1 pr-3 text-right font-medium">Rent</th>
                <th className="py-1 pr-3 text-right font-medium">Owed</th>
                <th className="py-1 pr-3 text-right font-medium">Held</th>
                <th className="py-1 text-right font-medium">Deposit</th>
              </tr>
            </thead>
            <tbody>
              {snap.leases.map((l) => (
                <tr key={l.leaseId} className="border-t border-border">
                  <td className="py-2 pr-3">
                    {l.tenant}
                    <span className="block text-xs text-muted-foreground">
                      {l.unit} · {formatDate(l.start)} – {formatDate(l.end)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatCurrency(l.rent)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatCurrency(l.arrears)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatCurrency(l.heldForOwner)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {l.deposit ? formatCurrency(l.deposit.amount) : '—'}
                    {l.deposit && (
                      <span className="block text-xs text-muted-foreground">
                        {l.deposit.heldByGetRentos ? 'with GetRentos' : 'outside GetRentos'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold text-foreground">Open work</h2>
          {snap.openWork.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {snap.openWork.map((w) => (
                <li key={w.id}>
                  {w.category.toLowerCase().replace(/_/g, ' ')}: {w.description.slice(0, 80)} (
                  {w.status.toLowerCase()})
                </li>
              ))}
            </ul>
          )}
          <h2 className="mt-4 font-semibold text-foreground">Open matters</h2>
          {snap.openItems.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {snap.openItems.map((i) => (
                <li key={`${i.kind}-${i.id}`}>{i.label}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Records</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {snap.documents.length} document{snap.documents.length === 1 ? '' : 's'} ·{' '}
            {snap.inspections.length} inspection{snap.inspections.length === 1 ? '' : 's'}. They
            stay with the property; the incoming manager sees them from the effective date.
          </p>
          {pack.keysDeclaration && (
            <>
              <h2 className="mt-4 font-semibold text-foreground">Keys and access</h2>
              <p className="mt-2 text-sm text-muted-foreground">{pack.keysDeclaration}</p>
            </>
          )}
          {pack.depositAttestations && pack.depositAttestations.length > 0 && (
            <>
              <h2 className="mt-4 font-semibold text-foreground">
                Deposits held outside GetRentos
              </h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {pack.depositAttestations.map((a) => (
                  <li key={a.depositHoldId}>
                    {formatCurrency(a.amount)}: {TREATMENT[a.treatment]}
                    {a.note ? ` (${a.note})` : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Card>

      {canOutgoing && (
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold text-foreground">Sign as the outgoing manager</h2>
          {outside.map((d) => (
            <div key={d.id}>
              <p className="text-sm text-foreground">
                Deposit of {formatCurrency(d.amount)} ({d.tenant}, {d.unit}) you held outside
                GetRentos
              </p>
              <Select
                ariaLabel={`What happened to the ${formatCurrency(d.amount)} deposit`}
                value={deposits[d.id]?.treatment ?? ''}
                onValueChange={(value) =>
                  setDeposits((s) => ({
                    ...s,
                    [d.id]: {
                      note: s[d.id]?.note ?? '',
                      treatment: value as DepositTreatment,
                    },
                  }))
                }
                placeholder="What happened to it…"
                searchable={false}
                options={(Object.keys(TREATMENT) as DepositTreatment[]).map((t) => ({
                  value: t,
                  label: TREATMENT[t],
                }))}
                className="mt-1"
              />
              <Input
                aria-label="Reference or note"
                value={deposits[d.id]?.note ?? ''}
                onChange={(e) =>
                  setDeposits((s) => ({ ...s, [d.id]: { ...s[d.id], note: e.target.value } }))
                }
                placeholder="Transfer reference or note (optional)"
                className="mt-2"
              />
            </div>
          ))}
          <Field label="Keys, codes and access handed over" htmlFor="ho-keys">
            <Textarea
              rows={3}
              value={keys}
              onChange={(e) => setKeys(e.target.value)}
              placeholder="e.g. Two sets of front and back keys, gate remote, alarm code shared with the new manager"
            />
          </Field>
          <Button
            variant="primary"
            disabled={!outgoingReady}
            isLoading={signOutgoing.isPending}
            onClick={() => signOutgoing.mutate()}
          >
            Sign the handover
          </Button>
        </Card>
      )}

      {(canOwner || canIncoming) && (
        <Card className="p-5">
          <p className="text-sm text-foreground">
            {canOwner
              ? 'Acknowledge that this is the state of your property at the handover.'
              : 'Accept the handover: you take over from this state.'}
          </p>
          <Button
            className="mt-3"
            variant="primary"
            isLoading={sign.isPending}
            onClick={() => sign.mutate(canOwner ? 'owner' : 'incoming')}
          >
            {canOwner ? 'Acknowledge' : 'Accept the handover'}
          </Button>
        </Card>
      )}

      {open && (v?.isOwner || v?.isOutgoing || v?.isIncoming) && (
        <div>
          {showDispute ? (
            <Card className="space-y-3 p-5">
              <Field label="What is wrong with the handover?" htmlFor="ho-dispute">
                <Textarea
                  rows={3}
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  disabled={disputeText.trim().length < 10}
                  isLoading={dispute.isPending}
                  onClick={() => dispute.mutate()}
                >
                  Dispute the handover
                </Button>
                <Button variant="ghost" onClick={() => setShowDispute(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setShowDispute(true)}
              className="cursor-pointer text-sm text-muted-foreground underline"
            >
              Something isn&apos;t right? Dispute the handover instead of signing.
            </button>
          )}
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}
