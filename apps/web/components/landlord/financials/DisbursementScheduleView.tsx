'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CalendarClock, Repeat } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  CurrencyInput,
  DataTable,
  EmptyState,
  Field,
  Select,
  Skeleton,
  Switch,
  TableSkeleton,
  useToast,
} from '@sureground/ui';
import { formatCurrency, formatDate } from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
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
  // Held is the control working, not a failure: an amount over the auto-payout limit waits for a second approver.
  HELD: { label: 'Needs approval', variant: 'info' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

export function DisbursementScheduleView() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<DisbursementFrequency>('MONTHLY');
  const [reserveAmount, setReserveAmount] = useState(0);
  const [seeded, setSeeded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: landlordKeys.disbursementSchedule,
    queryFn: () => unwrap(disbursementScheduleService.get()),
  });

  // A schedule with no verified account to pay into skips every run silently.
  const { data: payoutAccount, isFetched: payoutAccountChecked } = useQuery({
    queryKey: ['landlord', 'settings', 'payout'],
    queryFn: async () => {
      const response = await landlordService.getPayoutAccount();
      return response.success ? (response.data ?? null) : null;
    },
  });
  const missingPayoutAccount = payoutAccountChecked && !payoutAccount?.verified;

  // Seeded during render, not in an effect, so arriving data doesn't cascade a second render.
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
      toast.success('Automatic payouts updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to save these settings.');
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
            <span className="text-sm">Held by Sureground for you</span>
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(balance)}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Rent and other receipts we are holding on your behalf.
          </p>
        </Card>

        <Card static className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span className="text-sm">Next automatic payout</span>
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {enabled && nextRunAt ? formatDate(nextRunAt, 'long') : 'Off'}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {enabled
              ? `About ${formatCurrency(payableNow)} would go out, keeping ${formatCurrency(reserveAmount)} back.`
              : 'Turn on automatic payouts to sweep your held balance to your bank.'}
          </p>
        </Card>
      </div>

      <Card static className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
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
        {enabled && missingPayoutAccount && (
          <Alert variant="warning" className="mt-4">
            You have no verified payout account, so scheduled payouts are skipped until you add one
            under{' '}
            <Link href="/landlord/settings" className="font-medium underline">
              Settings → Payout Account
            </Link>
            .
          </Alert>
        )}

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
          <Button onClick={() => save.mutate()} isLoading={save.isPending}>
            Save settings
          </Button>
        </div>
      </Card>

      <Card static className="p-5">
        <h3 className="text-base font-semibold text-foreground">Recent automatic payouts</h3>
        {isLoading ? (
          <div className="mt-4">
            <TableSkeleton rows={3} columns={4} />
          </div>
        ) : recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Repeat}
              title="No automatic payouts yet"
              description="Once a schedule runs, each payout shows up here."
            />
          </div>
        ) : (
          <div className="mt-4">
            <DataTable
              caption="Recent automatic payouts"
              data={recent}
              getRowKey={(r) => r.id}
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  className: 'text-foreground',
                  render: (r) => formatDate(r.paidAt ?? r.createdAt),
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  numeric: true,
                  className: 'text-foreground',
                  render: (r) => formatCurrency(r.amount),
                },
                {
                  key: 'reserve',
                  header: 'Reserve kept',
                  numeric: true,
                  className: 'text-muted-foreground',
                  render: (r) => formatCurrency(r.reserveAmount),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => {
                    const badge = STATUS_BADGE[r.status];
                    return (
                      <>
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
                      </>
                    );
                  },
                },
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
