'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CalendarClock, Repeat } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  EmptyState,
  Field,
  Select,
  Switch,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import {
  disbursementScheduleService,
  type DisbursementFrequency,
  type DisbursementStatus,
} from '@/services/disbursementScheduleService';

const FREQUENCY_OPTIONS: { value: DisbursementFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Every week' },
  { value: 'FORTNIGHTLY', label: 'Every two weeks' },
  { value: 'MONTHLY', label: 'Every month' },
];

const STATUS_BADGE: Record<
  DisbursementStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }
> = {
  SUCCESS: { label: 'Paid out', variant: 'success' },
  PENDING: { label: 'Payout pending', variant: 'warning' },
  // Held is the control working, not a failure: an amount over the auto-payout
  // limit waits for a second approver on an owner statement.
  HELD: { label: 'Needs approval', variant: 'info' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

export function DisbursementScheduleView() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<DisbursementFrequency>('MONTHLY');
  const [reserveAmount, setReserveAmount] = useState(0);
  const [seeded, setSeeded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: landlordKeys.disbursementSchedule,
    queryFn: () => unwrap(disbursementScheduleService.get()),
  });

  // Seed the form from the saved schedule once, during render (the React-blessed
  // "adjust state when data arrives" pattern — an effect that setState's would
  // cascade a render).
  if (!seeded && data?.schedule) {
    setSeeded(true);
    setEnabled(data.schedule.enabled);
    setFrequency(data.schedule.frequency);
    setReserveAmount(data.schedule.reserveAmount);
  }

  const save = useMutation({
    mutationFn: () =>
      unwrap(disbursementScheduleService.set({ frequency, reserveAmount, enabled })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.disbursementSchedule });
      setToast({ message: 'Automatic payouts updated.', variant: 'success' });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to save these settings.', variant: 'error' });
    },
  });

  const balance = data?.balance ?? 0;
  const recent = data?.recent ?? [];
  const nextRunAt = data?.schedule?.nextRunAt ?? null;
  const payableNow = Math.max(0, balance - reserveAmount);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card static className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span className="text-sm">Held by GetRentos for you</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(balance)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rent and other receipts we are holding on your behalf.
          </p>
        </Card>

        <Card static className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span className="text-sm">Next automatic payout</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {enabled && nextRunAt ? formatDate(nextRunAt, 'long') : 'Off'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {enabled
              ? `About ${formatCurrency(payableNow)} would go out, keeping ${formatCurrency(reserveAmount)} back.`
              : 'Turn on automatic payouts to sweep your held balance to your bank.'}
          </p>
        </Card>
      </div>

      <Card static className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Automatic payouts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sweep your held balance to your verified bank account on a schedule, keeping a reserve
              behind as a float. Anything above the auto-payout limit waits for approval on an owner
              statement.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Enable automatic payouts"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="How often">
            <Select
              value={frequency}
              onValueChange={(value) => setFrequency(value as DisbursementFrequency)}
              options={FREQUENCY_OPTIONS}
              disabled={!enabled}
            />
          </Field>
          <Field
            label="Reserve to keep back"
            hint="This stays in the account as a float for upcoming costs."
          >
            <CurrencyInput
              value={reserveAmount}
              onValueChange={setReserveAmount}
              prefix="₦"
              disabled={!enabled}
              placeholder="0"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </Card>

      <Card static className="p-5">
        <h3 className="text-base font-semibold text-foreground">Recent automatic payouts</h3>
        {isLoading ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-secondary/50" />
        ) : recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Repeat}
              title="No automatic payouts yet"
              description="Once a schedule runs, each payout shows up here."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                  <th className="p-3 font-medium text-right">Reserve kept</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const badge = STATUS_BADGE[r.status];
                  return (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="p-3 text-foreground">{formatDate(r.paidAt ?? r.createdAt)}</td>
                      <td className="p-3 text-right text-foreground">{formatCurrency(r.amount)}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {formatCurrency(r.reserveAmount)}
                      </td>
                      <td className="p-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {r.status === 'HELD' && r.heldReason ? (
                          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                            {r.heldReason}
                          </p>
                        ) : null}
                        {r.status === 'FAILED' && r.failureReason ? (
                          <p className="mt-1 max-w-xs text-xs text-destructive">
                            {r.failureReason}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
