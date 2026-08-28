'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { Banknote, CircleDollarSign, Wallet } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';

const PAYOUT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  SUCCESS: 'success',
  PENDING: 'info',
  FAILED: 'danger',
};

export function ShortletPayoutsDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: summary } = useQuery({
    queryKey: ['shortlets', 'host', 'payout-summary'],
    queryFn: () => unwrap(shortletService.payoutSummary()),
  });
  const { data: account } = useQuery({
    queryKey: ['shortlets', 'host', 'payout-account'],
    queryFn: () => unwrap(shortletService.payoutAccount()),
  });
  const { data: payouts } = useQuery({
    queryKey: shortletKeys.hostPayouts,
    queryFn: () => unwrap(shortletService.myPayouts({ page: 1, pageSize: 20 })),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shortlets', 'host'] });
    queryClient.invalidateQueries({ queryKey: shortletKeys.hostPayouts });
  };

  const saveAccount = useMutation({
    mutationFn: () => unwrap(shortletService.savePayoutAccount({ bankCode, accountNumber })),
    onSuccess: () => {
      invalidate();
      setBankCode('');
      setAccountNumber('');
      setToast({ message: 'Payout account saved.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const withdraw = useMutation({
    mutationFn: () => unwrap(shortletService.requestPayout()),
    onSuccess: (p) => {
      invalidate();
      setToast({
        message: `Withdrawal of ${formatCurrency(p.amount)} is on its way.`,
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="p-5">
          <DialogTitle>Host payouts</DialogTitle>
          <DialogDescription>
            Withdraw your shortlet earnings to your bank account.
          </DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          {/* Balance */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Available to withdraw</p>
                <p className="text-xl font-semibold">{formatCurrency(summary?.available ?? 0)}</p>
              </div>
            </div>
            <Button
              onClick={() => withdraw.mutate()}
              disabled={!summary?.accountSet || !summary.available || withdraw.isPending}
            >
              <Banknote className="mr-1.5 h-4 w-4" />
              {withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          </div>

          {/* Payout account */}
          {account ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Payout account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {account.bankName} · {account.accountNumber} · {account.accountName}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                To change it, enter new details below and save.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4">
              <p className="text-sm font-medium">Set up your payout account</p>
              <p className="mb-3 mt-1 text-xs text-muted-foreground">
                Your earnings are paid to this NUBAN bank account.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bank code" hint="e.g. 058 for GTBank">
                  <Input
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="058"
                    maxLength={6}
                  />
                </Field>
                <Field label="Account number">
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="0123456789"
                    maxLength={10}
                  />
                </Field>
              </div>
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => saveAccount.mutate()}
                disabled={
                  bankCode.length < 3 || accountNumber.length !== 10 || saveAccount.isPending
                }
              >
                {saveAccount.isPending ? 'Saving…' : 'Save account'}
              </Button>
            </div>
          )}

          {/* Ledger */}
          <div>
            <p className="mb-2 text-sm font-medium">Payout history</p>
            {payouts && payouts.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No withdrawals yet — earnings appear here once you withdraw.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {(payouts?.items ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <Badge variant={PAYOUT_STATUS_VARIANT[p.status]}>{p.status}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.bookingCount} booking{p.bookingCount === 1 ? '' : 's'} ·{' '}
                        {formatDate(p.createdAt, 'short')}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CircleDollarSign className="h-3.5 w-3.5" /> Payouts transfer to your bank via Paystack.
          </p>
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
