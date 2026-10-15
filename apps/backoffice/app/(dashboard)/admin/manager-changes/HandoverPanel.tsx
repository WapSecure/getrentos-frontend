'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Textarea } from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminManagementTransfersService } from '@/services/adminManagementTransfersService';

const TREATMENTS = [
  ['HANDED_TO_INCOMING', 'Handed to the incoming manager'],
  ['RETURNED_TO_TENANT', 'Returned to the tenant'],
  ['PAID_TO_GETRENTOS', 'Paid to GetRentos'],
] as const;

/** A handover's sign-off from the GetRentos side: settle a dispute, or sign for the side GetRentos holds. */
export function HandoverPanel({
  transferId,
  canOperate,
}: {
  transferId: string;
  canOperate: boolean;
}) {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState('');
  const [keys, setKeys] = useState('');
  const [deposits, setDeposits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ['admin', 'handover', transferId],
    queryFn: () => unwrap(adminManagementTransfersService.handover(transferId)),
  });
  const refresh = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: ['admin', 'handover', transferId] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'management-transfers'] });
  };
  const fail = (e: Error) => setError(e.message);
  const resolve = useMutation({
    mutationFn: () =>
      unwrap(adminManagementTransfersService.resolve(transferId, resolution.trim())),
    onSuccess: refresh,
    onError: fail,
  });
  const accept = useMutation({
    mutationFn: () =>
      unwrap(adminManagementTransfersService.signIncoming(transferId, q.data!.pack!.hash)),
    onSuccess: refresh,
    onError: fail,
  });
  const confirmDeposit = useMutation({
    mutationFn: (depositHoldId: string) =>
      unwrap(adminManagementTransfersService.confirmDeposit(transferId, depositHoldId)),
    onSuccess: refresh,
    onError: fail,
  });
  const h = q.data;
  const pack = h?.pack;
  const outside = (pack?.snapshot.leases ?? []).flatMap((l) =>
    l.deposit && !l.deposit.heldByGetRentos ? [{ ...l.deposit, tenant: l.tenant }] : []
  );
  const signOutgoing = useMutation({
    mutationFn: () =>
      unwrap(
        adminManagementTransfersService.signOutgoing(transferId, {
          hash: pack!.hash,
          keysDeclaration: keys.trim(),
          deposits: outside.map((d) => ({ depositHoldId: d.id, treatment: deposits[d.id] })),
        })
      ),
    onSuccess: refresh,
    onError: fail,
  });

  if (q.isLoading) return <p className="text-xs text-muted-foreground">Loading handover…</p>;
  if (!h || !pack) return <p className="text-xs text-muted-foreground">No handover pack yet.</p>;

  const waitingOnOutgoing = h.required.outgoing && !pack.outgoingSignedAt;
  const row = (label: string, at: string | null, required = true) =>
    required ? (
      <li>
        {at ? '✓' : '○'} {label}
        {at ? ` · ${formatDate(at)}` : ''}
      </li>
    ) : null;

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3 text-sm">
      <p className="text-xs text-muted-foreground">
        Pack {pack.hash.slice(0, 12)} · owed {formatCurrency(pack.snapshot.totals.arrears)} · held{' '}
        {formatCurrency(pack.snapshot.totals.heldForOwner)} · deposits outside GetRentos{' '}
        {formatCurrency(pack.snapshot.totals.depositsOutside)}
      </p>
      <ul className="space-y-0.5 text-xs text-foreground">
        {row(
          `${pack.snapshot.outgoing ?? 'Outgoing'} signs`,
          pack.outgoingSignedAt,
          h.required.outgoing
        )}
        {row('Owner acknowledges', pack.ownerSignedAt)}
        {row(`${pack.snapshot.incoming} accepts`, pack.incomingSignedAt, h.required.incoming)}
      </ul>
      {pack.depositAttestations?.map((a) => {
        const now = h.depositsNow?.find((d) => d.id === a.depositHoldId);
        const awaiting = a.treatment === 'PAID_TO_GETRENTOS' && now && !now.heldByGetRentos;
        return (
          <div
            key={a.depositHoldId}
            className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
          >
            <span>
              Deposit {formatCurrency(a.amount)}: {a.treatment.replace(/_/g, ' ').toLowerCase()}
              {a.note ? ` (${a.note})` : ''}
              {a.treatment === 'PAID_TO_GETRENTOS' && now?.heldByGetRentos ? ' · received' : ''}
            </span>
            {awaiting && canOperate && (
              <Button
                size="sm"
                variant="outline"
                disabled={confirmDeposit.isPending}
                onClick={() => confirmDeposit.mutate(a.depositHoldId)}
              >
                Confirm received
              </Button>
            )}
          </div>
        );
      })}
      {pack.keysDeclaration && (
        <p className="text-xs text-muted-foreground">Keys: {pack.keysDeclaration}</p>
      )}

      {h.status === 'DISPUTED' && (
        <div className="rounded-lg bg-warning-subtle p-3">
          <p className="text-xs text-foreground">Disputed: {pack.disputeReason}</p>
          {canOperate && (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
              <Textarea
                rows={2}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="How it was settled (at least 10 characters)"
                className="flex-1"
              />
              <Button
                size="sm"
                variant="primary"
                disabled={resolution.trim().length < 10 || resolve.isPending}
                onClick={() => resolve.mutate()}
              >
                Record resolution
              </Button>
            </div>
          )}
        </div>
      )}
      {pack.disputeResolution && h.status !== 'DISPUTED' && (
        <p className="text-xs text-muted-foreground">Dispute settled: {pack.disputeResolution}</p>
      )}

      {canOperate && h.status === 'SWITCHED' && h.viewer?.isOutgoing && !pack.outgoingSignedAt && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-foreground">Sign for GetRentos (outgoing)</p>
          {outside.map((d) => (
            <select
              key={d.id}
              aria-label={`Deposit ${d.amount}`}
              value={deposits[d.id] ?? ''}
              onChange={(e) => setDeposits((s) => ({ ...s, [d.id]: e.target.value }))}
              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
            >
              <option value="">
                Deposit {formatCurrency(d.amount)} ({d.tenant}): what happened…
              </option>
              {TREATMENTS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          ))}
          <Textarea
            rows={2}
            value={keys}
            onChange={(e) => setKeys(e.target.value)}
            placeholder="Keys, codes and access handed over"
          />
          <Button
            size="sm"
            variant="primary"
            disabled={
              keys.trim().length < 10 ||
              outside.some((d) => !deposits[d.id]) ||
              signOutgoing.isPending
            }
            onClick={() => signOutgoing.mutate()}
          >
            Sign handover
          </Button>
        </div>
      )}
      {canOperate &&
        h.status === 'SWITCHED' &&
        h.viewer?.isIncoming &&
        !pack.incomingSignedAt &&
        !waitingOnOutgoing && (
          <Button
            size="sm"
            variant="primary"
            disabled={accept.isPending}
            onClick={() => accept.mutate()}
          >
            Accept for GetRentos
          </Button>
        )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
