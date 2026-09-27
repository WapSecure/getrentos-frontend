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
  EmptyState,
  Field,
  Pagination,
  Select,
  Skeleton,
  Textarea,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { CalendarX } from 'lucide-react';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminShortletService } from '@/services/adminShortletService';
import type { AdminHostPenalty, AdminHostPenaltyStatus } from '@/types/shortlet';

const PAGE_SIZE = 12;
const QUERY_KEY = ['admin', 'shortlets', 'host-penalties'] as const;

const STATUS_VARIANT: Record<AdminHostPenaltyStatus, BadgeVariant> = {
  OUTSTANDING: 'warning',
  SETTLED: 'success',
  WAIVED: 'neutral',
};

const STATUS_LABEL: Record<AdminHostPenaltyStatus, string> = {
  OUTSTANDING: 'Owed',
  SETTLED: 'Collected',
  WAIVED: 'Waived',
};

const FILTERS: { value: 'all' | AdminHostPenaltyStatus; label: string }[] = [
  { value: 'OUTSTANDING', label: 'Owed' },
  { value: 'SETTLED', label: 'Collected' },
  { value: 'WAIVED', label: 'Waived' },
  { value: 'all', label: 'All fees' },
];

/**
 * Fees hosts owe for cancelling paid, confirmed stays. They come out of the
 * host's payouts automatically; support can waive what is left for genuine
 * emergencies.
 */
export function HostCancellationFeesPanel({ canWaive }: { canWaive: boolean }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'all' | AdminHostPenaltyStatus>('OUTSTANDING');
  const [page, setPage] = useState(1);
  const [waiveTarget, setWaiveTarget] = useState<AdminHostPenalty | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEY, { status, page }],
    queryFn: () =>
      unwrap(
        adminShortletService.listHostPenalties({
          status: status === 'all' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const rows = data?.items ?? [];

  const waive = useMutation({
    mutationFn: () => unwrap(adminShortletService.waiveHostPenalty(waiveTarget!.id, reason.trim())),
    onSuccess: (fee) => {
      setWaiveTarget(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setToast({ message: `Fee waived for ${fee.hostName ?? 'the host'}.`, variant: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message, variant: 'error' }),
  });

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="text-sm font-medium">Host cancellation fees</p>
          <p className="text-xs text-muted-foreground">
            Charged when a host cancels a paid stay (10% 30+ days out, 25% 7–29 days, 50% under 7
            days, capped at ₦250,000), taken from their payouts.
          </p>
        </div>
        <div className="w-44">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as 'all' | AdminHostPenaltyStatus);
              setPage(1);
            }}
            options={FILTERS}
          />
        </div>
      </div>

      {isError ? (
        <div className="p-6 text-sm">
          <p className="text-destructive">Could not load cancellation fees.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No cancellation fees"
          description="Fees appear here when a host cancels a paid, confirmed stay."
        />
      ) : (
        <div className="divide-y divide-border">
          {rows.map((fee) => (
            <div key={fee.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{fee.hostName ?? fee.hostId}</span>
                  <Badge variant={STATUS_VARIANT[fee.status]}>{STATUS_LABEL[fee.status]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fee.listingTitle} · stay {formatDate(fee.checkIn, 'short')} to{' '}
                  {formatDate(fee.checkOut, 'short')} · cancelled {fee.daysBeforeCheckIn} day
                  {fee.daysBeforeCheckIn === 1 ? '' : 's'} before check-in
                </p>
                {fee.cancellationReason && (
                  <p className="text-xs">
                    Host&rsquo;s reason: &ldquo;{fee.cancellationReason}&rdquo;
                  </p>
                )}
                {fee.waiverReason && (
                  <p className="text-xs text-muted-foreground">
                    Waived{fee.waivedAt ? ` ${formatDate(fee.waivedAt, 'short')}` : ''}:{' '}
                    {fee.waiverReason}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{formatCurrency(fee.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {fee.percent}% · {formatCurrency(fee.settledAmount)} collected
                  {fee.outstanding > 0 ? ` · ${formatCurrency(fee.outstanding)} owed` : ''}
                </p>
                {canWaive && fee.status === 'OUTSTANDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setReason('');
                      setWaiveTarget(fee);
                    }}
                  >
                    Waive
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />

      {waiveTarget && (
        <Dialog open onOpenChange={(o) => !o && setWaiveTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <div className="p-5">
              <DialogTitle>Waive this fee?</DialogTitle>
              <DialogDescription>
                {waiveTarget.hostName ?? 'The host'} won&rsquo;t have the remaining{' '}
                {formatCurrency(waiveTarget.outstanding)} taken from their payouts. What was already
                collected stays collected. Use this for genuine emergencies.
              </DialogDescription>
            </div>
            <div className="space-y-4 border-t border-border p-5">
              <Field label="Reason (kept in the audit log)">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Flooding in Lekki made the flat unsafe; photos on file."
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setWaiveTarget(null)}
                  disabled={waive.isPending}
                >
                  Keep the fee
                </Button>
                <Button
                  onClick={() => waive.mutate()}
                  disabled={waive.isPending || reason.trim().length < 5}
                >
                  {waive.isPending ? 'Waiving…' : 'Waive fee'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
