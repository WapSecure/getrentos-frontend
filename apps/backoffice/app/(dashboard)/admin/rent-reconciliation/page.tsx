'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GitCompareArrows } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageErrorState,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminJournalService,
  type Reconciliation,
  type ReconciliationItemKind,
} from '@/services/adminJournalService';

const KIND: Record<
  ReconciliationItemKind,
  { label: string; variant: 'success' | 'warning' | 'danger'; help: string }
> = {
  MATCHED: { label: 'Matched', variant: 'success', help: '' },
  AMOUNT_MISMATCH: {
    label: 'Amount differs',
    variant: 'warning',
    help: 'Same reference, different amount.',
  },
  MISSING_IN_BOOKS: {
    label: 'Not in the books',
    variant: 'danger',
    help: 'The gateway took money GetRentos has no record of.',
  },
  MISSING_AT_GATEWAY: {
    label: 'Not at the gateway',
    variant: 'danger',
    help: 'GetRentos recorded money the gateway does not show.',
  },
};

function lastEndedMonth(): string {
  const lagos = new Date(Date.now() + 60 * 60_000);
  const d = new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Rent money as the gateway reports it, matched reference by reference with
 * the rent journal for a month. Every line that does not match needs a person
 * to record what it was before the month can close.
 */
export default function RentReconciliationPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canAct = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const [period, setPeriod] = useState(lastEndedMonth());
  const [csv, setCsv] = useState<{ name: string; text: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'reconciliations'],
    queryFn: () => unwrap(adminJournalService.reconciliations()),
  });
  const detail = useQuery({
    queryKey: ['admin', 'reconciliations', openId],
    enabled: !!openId,
    queryFn: () => unwrap(adminJournalService.reconciliation(openId!)),
  });

  const done = (r: Reconciliation) => {
    queryClient.setQueryData(['admin', 'reconciliations', r.id], r);
    queryClient.invalidateQueries({ queryKey: ['admin', 'reconciliations'], exact: true });
    queryClient.invalidateQueries({ queryKey: ['admin', 'journal'] });
    setOpenId(r.id);
  };
  const fail = (e: Error) =>
    setToast({ message: e.message || 'That did not work.', variant: 'error' });
  const exceptions = (r: Reconciliation) =>
    (r.items ?? []).filter((i) => i.kind !== 'MATCHED').length;

  const upload = useMutation({
    mutationFn: () => unwrap(adminJournalService.reconcileCsv(period, csv!.text)),
    onSuccess: (r) => {
      done(r);
      setCsv(null);
      setToast({
        message: exceptions(r) ? `${exceptions(r)} line(s) need a look.` : 'Everything matched.',
        variant: exceptions(r) ? 'error' : 'success',
      });
    },
    onError: fail,
  });
  const pull = useMutation({
    mutationFn: () => unwrap(adminJournalService.reconcileGateway(period)),
    onSuccess: done,
    onError: fail,
  });
  const resolve = useMutation({
    mutationFn: ({ itemId, text }: { itemId: string; text: string }) =>
      unwrap(adminJournalService.resolveItem(itemId, text)),
    onSuccess: (r, { itemId }) => {
      setNotes((n) => ({ ...n, [itemId]: '' }));
      done(r);
    },
    onError: fail,
  });

  const r = detail.data;

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <GitCompareArrows className="h-6 w-6 text-primary" aria-hidden />
          Rent reconciliation
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Match what the payment gateway says came in and went back out against the rent books,
          month by month. Upload the gateway&apos;s transactions export (it needs Reference and
          Amount columns; Status, Type and Paid At are used when present), or pull it from the
          gateway directly.
        </p>
      </div>

      {canAct && (
        <Card className="mb-6 flex flex-wrap items-end gap-3 p-5">
          <div>
            <label htmlFor="rec-month" className="block text-sm font-medium text-foreground">
              Month
            </label>
            <input
              id="rec-month"
              value={period}
              onChange={(e) => setPeriod(e.target.value.trim())}
              placeholder="YYYY-MM"
              className="mt-1 h-10 w-32 rounded-lg border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="rec-file" className="block text-sm font-medium text-foreground">
              Gateway export (CSV)
            </label>
            <input
              id="rec-file"
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                setCsv(f ? { name: f.name, text: await f.text() } : null);
              }}
              className="mt-1 block text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-secondary file:px-3 file:py-2 file:text-sm file:text-foreground"
            />
          </div>
          <Button
            variant="primary"
            disabled={!csv || upload.isPending || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)}
            onClick={() => upload.mutate()}
          >
            {upload.isPending ? 'Matching…' : 'Reconcile export'}
          </Button>
          <Button
            variant="outline"
            disabled={pull.isPending || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)}
            onClick={() => pull.mutate()}
          >
            {pull.isPending ? 'Pulling…' : 'Pull from gateway'}
          </Button>
        </Card>
      )}

      {list.isError ? (
        <PageErrorState
          title="Could not load reconciliations"
          description={(list.error as Error).message}
          onRetry={() => list.refetch()}
        />
      ) : list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !list.data?.length ? (
        <EmptyState
          icon={GitCompareArrows}
          title="No reconciliations yet"
          description="Reconcile a month to match the gateway against the books."
        />
      ) : (
        <div className="space-y-3">
          {list.data.map((x) => (
            <Card key={x.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {x.period} · gateway {formatCurrency(x.totals.gatewayIn)} in · books{' '}
                    {formatCurrency(x.totals.booksIn)} in
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {x.source === 'CSV' ? 'Uploaded export' : 'Pulled from the gateway'} ·{' '}
                    {formatDate(x.createdAt)}
                    {x.totals.skipped
                      ? ` · ${x.totals.skipped} non-rent or other-month lines skipped`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={x.status === 'RESOLVED' ? 'success' : 'warning'}>
                    {x.status === 'RESOLVED'
                      ? 'Reconciled'
                      : `${x._count?.items ?? 0} open line${x._count?.items === 1 ? '' : 's'}`}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenId(openId === x.id ? null : x.id)}
                  >
                    {openId === x.id ? 'Hide' : 'Open'}
                  </Button>
                </div>
              </div>

              {openId === x.id && r && (
                <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  {(r.items ?? []).map((i) => (
                    <li key={i.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="break-all font-mono text-xs text-foreground">
                            {i.direction === 'OUT' ? 'Refund · ' : ''}
                            {i.reference}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Gateway{' '}
                            {i.gatewayAmount != null ? formatCurrency(i.gatewayAmount) : '—'} ·
                            books {i.bookAmount != null ? formatCurrency(i.bookAmount) : '—'}
                            {KIND[i.kind].help ? ` · ${KIND[i.kind].help}` : ''}
                          </p>
                        </div>
                        <Badge variant={KIND[i.kind].variant}>{KIND[i.kind].label}</Badge>
                      </div>
                      {i.kind !== 'MATCHED' &&
                        (i.resolvedAt ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Resolved: {i.resolution}
                          </p>
                        ) : canAct ? (
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
                            <Textarea
                              rows={2}
                              value={notes[i.id] ?? ''}
                              onChange={(e) => setNotes((n) => ({ ...n, [i.id]: e.target.value }))}
                              placeholder="What this was and what was done (at least 10 characters)"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={(notes[i.id] ?? '').trim().length < 10 || resolve.isPending}
                              onClick={() =>
                                resolve.mutate({ itemId: i.id, text: notes[i.id].trim() })
                              }
                            >
                              Resolve
                            </Button>
                          </div>
                        ) : null)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
