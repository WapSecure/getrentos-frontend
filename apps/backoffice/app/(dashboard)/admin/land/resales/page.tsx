'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CircleAlert, ScrollText } from 'lucide-react';
import { Badge, Button, EmptyState, Textarea, Toast, type ToastVariant, Card } from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { readLandApiError } from '@/lib/landDiligence';
import {
  adminLandResaleService,
  landResaleKeys,
  type LandResaleCondition,
  type LandResaleQueueItem,
} from '@/services/adminLandResaleService';

const STATUS: Record<
  LandResaleCondition['status'],
  { label: string; variant: 'success' | 'info' | 'neutral' | 'danger' }
> = {
  PENDING: { label: 'Open', variant: 'neutral' },
  DELIVERED: { label: 'Awaiting buyer', variant: 'info' },
  SATISFIED: { label: 'Met', variant: 'success' },
  WAIVED: { label: 'Waived', variant: 'success' },
  FAILED: { label: 'Not met', variant: 'danger' },
};

const ConditionRow = ({
  txId,
  condition,
  canDecide,
  onDone,
}: {
  txId: string;
  condition: LandResaleCondition;
  canDecide: boolean;
  onDone: (next: LandResaleCondition[], message: string) => void;
}) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const decide = useMutation({
    mutationFn: (status: 'SATISFIED' | 'FAILED') =>
      unwrap(adminLandResaleService.decide(txId, condition.key, status, note.trim())),
    onSuccess: (next, status) => {
      setNote('');
      onDone(next, status === 'FAILED' ? 'Marked not met; both sides were told.' : 'Marked met.');
    },
    onError: (e) => setError(readLandApiError(e, 'Could not record the decision.').message),
  });
  const shown =
    condition.failed && condition.status !== 'FAILED' ? STATUS.FAILED : STATUS[condition.status];
  const decidable =
    condition.status === 'PENDING' ||
    condition.status === 'DELIVERED' ||
    condition.status === 'FAILED';
  return (
    <li className="rounded-xl border border-border p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-foreground">{condition.label}</p>
        <Badge variant={shown.variant}>{shown.label}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {condition.basis ??
          (condition.deadline ? `Deadline ${formatDate(condition.deadline)}` : 'No deadline')}
      </p>
      {condition.deliveredNote && (
        <p className="mt-1 text-xs text-foreground">Seller: “{condition.deliveredNote}”</p>
      )}
      {condition.note && <p className="mt-1 text-xs text-muted-foreground">{condition.note}</p>}
      {canDecide && decidable && (
        <div className="mt-2 space-y-2">
          <Textarea
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label={`Decision note for ${condition.label}`}
            placeholder="What you checked (search report, site visit, document) and the decision"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={note.trim().length < 5 || decide.isPending}
              isLoading={decide.isPending && decide.variables === 'SATISFIED'}
              onClick={() => decide.mutate('SATISFIED')}
            >
              Mark met
            </Button>
            {condition.status !== 'FAILED' && (
              <Button
                size="sm"
                variant="danger"
                disabled={note.trim().length < 5 || decide.isPending}
                isLoading={decide.isPending && decide.variables === 'FAILED'}
                onClick={() => decide.mutate('FAILED')}
              >
                Mark not met
              </Button>
            )}
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
};

const SaleConditions = ({
  sale,
  canDecide,
  onToast,
}: {
  sale: LandResaleQueueItem;
  canDecide: boolean;
  onToast: (message: string) => void;
}) => {
  const queryClient = useQueryClient();
  const key = landResaleKeys.conditions(sale.transactionId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminLandResaleService.conditions(sale.transactionId)),
  });
  if (query.isLoading)
    return <div className="h-24 animate-pulse rounded-xl bg-secondary" aria-busy="true" />;
  const conditions = query.data ?? [];
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {conditions.map((condition) => (
          <ConditionRow
            key={condition.key}
            txId={sale.transactionId}
            condition={condition}
            canDecide={canDecide}
            onDone={(next, message) => {
              queryClient.setQueryData(key, next);
              void queryClient.invalidateQueries({ queryKey: landResaleKeys.queue });
              onToast(message);
            }}
          />
        ))}
      </ul>
      {conditions[0] && <p className="text-xs text-muted-foreground">{conditions[0].remedy}</p>}
    </div>
  );
};

/** Land resales held in escrow whose conditions precedent are open or failed (§9.3). */
export default function AdminLandResalesPage() {
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'sales.view');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const query = useQuery({
    queryKey: landResaleKeys.queue,
    queryFn: () => unwrap(adminLandResaleService.queue()),
    enabled: canView,
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to land resales"
        description="This needs the sales view permission."
      />
    );
  }
  const items = query.data ?? [];
  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Land resale conditions</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Whole-parcel sales held in escrow with a condition still open or failed. The money is not
          released while any is open; a failed condition lets the buyer take a full refund. Decide a
          condition here when the buyer and seller disagree or a check needs GetRentos.
        </p>
      </div>
      {query.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nothing open"
          description="Every land resale in escrow has its conditions met or waived."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((sale) => {
            const expanded = open === sale.transactionId;
            return (
              <li key={sale.transactionId}>
                <Card>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : sale.transactionId)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{sale.propertyTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.sellerName} to {sale.buyerName} ·{' '}
                        {formatCurrency(sale.amount, { compact: true })}
                        {sale.nextDeadline
                          ? ` · next deadline ${formatDate(sale.nextDeadline)}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {sale.failedConditions > 0 && (
                        <Badge variant="danger">{sale.failedConditions} failed</Badge>
                      )}
                      {sale.awaitingBuyer > 0 && (
                        <Badge variant="info">{sale.awaitingBuyer} awaiting buyer</Badge>
                      )}
                      <Badge variant="neutral">{sale.openConditions} open</Badge>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-border p-4">
                      <SaleConditions
                        sale={sale}
                        canDecide={canDecide}
                        onToast={(message) => setToast({ message, variant: 'success' })}
                      />
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
