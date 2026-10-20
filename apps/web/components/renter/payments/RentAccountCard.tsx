'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { Alert, Button, Card, ConfirmDialog } from '@getrentos/ui';
import { CreditRefundHistory } from '@/components/shared/CreditRefundHistory';
import { formatCurrency, formatDate } from '@/lib/format';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';

/**
 * Money paid in per lease: each payment, what it paid, and any credit held
 * (an overpayment), which pays the next invoice automatically — or can be
 * refunded to the card or account it came from.
 */
export const RentAccountCard = () => {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<{ leaseId: string; amount: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const accounts = useQuery({
    queryKey: ['renter', 'rent-accounts'],
    queryFn: () => unwrap(renterService.listRentAccounts()),
  });
  const refund = useMutation({
    mutationFn: (leaseId: string) => unwrap(renterService.refundCredit(leaseId)),
    onSuccess: (r) => {
      setMessage(
        r.status === 'REFUNDED'
          ? { text: `${formatCurrency(r.refundedAmount)} is on its way back to you.`, ok: true }
          : {
              text:
                r.refundedAmount > 0
                  ? `${formatCurrency(r.refundedAmount)} is on its way back; the rest could not be refunded and stays as credit.`
                  : 'The refund could not be made and your credit is unchanged. GetRentos finance sees failed refunds and follows up.',
              ok: false,
            }
      );
      queryClient.invalidateQueries({ queryKey: ['renter', 'rent-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['renter', 'payments'] });
    },
    onError: (e: Error) => setMessage({ text: e.message, ok: false }),
  });
  const list = accounts.data ?? [];
  if (!list.length) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Wallet className="w-4 h-4 text-primary" /> Rent account
      </h3>
      <div className="mt-3 space-y-4">
        {list.map((a) => (
          <div key={a.leaseId}>
            <p className="text-sm font-medium text-foreground">
              {a.propertyName} • {a.unitName}
            </p>
            {a.creditBalance > 0 && (
              <div className="mt-1 rounded-lg bg-success-subtle px-2 py-1.5 text-xs text-success">
                <p>
                  {formatCurrency(a.creditBalance)} credit: it pays your next invoice automatically.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1.5"
                  disabled={refund.isPending}
                  isLoading={refund.isPending && refund.variables === a.leaseId}
                  onClick={() => {
                    setMessage(null);
                    setConfirming({ leaseId: a.leaseId, amount: a.creditBalance });
                  }}
                >
                  Refund it to me instead
                </Button>
              </div>
            )}
            <ul className="mt-2 space-y-1.5">
              {a.receipts.slice(0, 5).map((r) => (
                <li key={r.id} className="text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Paid {formatDate(r.receivedAt)}</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {[
                      ...r.allocations.map(
                        (al) => `${formatCurrency(al.amount)} to rent due ${formatDate(al.dueDate)}`
                      ),
                      ...(r.toCredit > 0 ? [`${formatCurrency(r.toCredit)} to credit`] : []),
                    ].join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
            {(a.creditApplied ?? []).length > 0 && (
              <ul className="mt-2 space-y-1">
                {(a.creditApplied ?? []).slice(0, 5).map((c) => (
                  <li
                    key={`${c.rentPaymentId}-${c.appliedAt}`}
                    className="flex justify-between gap-2 text-xs"
                  >
                    <span className="text-muted-foreground">
                      Credit used on rent due {formatDate(c.dueDate)}
                    </span>
                    <span className="text-success tabular-nums">{formatCurrency(c.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <CreditRefundHistory refunds={a.refunds} />
          </div>
        ))}
      </div>
      {message && (
        <Alert variant={message.ok ? 'success' : 'warning'} className="mt-3">
          {message.text}
        </Alert>
      )}
      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Refund your credit"
        description={`Anything you owe on this lease is paid from the credit first. The rest${
          confirming ? ` (up to ${formatCurrency(confirming.amount)})` : ''
        } goes back to the card or account you paid with. Banks can take a few working days to show it.`}
        confirmLabel="Refund my credit"
        onConfirm={() => {
          if (confirming) refund.mutate(confirming.leaseId);
          setConfirming(null);
        }}
      />
    </Card>
  );
};
