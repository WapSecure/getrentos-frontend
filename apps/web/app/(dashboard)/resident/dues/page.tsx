'use client';

import { PayDialog } from '@/components/shared/payments/PayDialog';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/types/payments';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptText, Repeat } from '@sureground/icons';
import { Badge, Button, EmptyState, ListSkeleton, PageHeader, Pagination } from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { residentServiceChargesService } from '@/services/residentServiceChargesService';
import { ServiceChargesTab } from '@/components/renter/payments/ServiceChargesTab';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import type { Due } from '@/types/estate';

const statusVariant: Record<Due['status'], 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  processing: 'warning',
  waived: 'success',
};

const categoryLabels: Record<Due['category'], string> = {
  rent: 'Rent',
  service_charge: 'Service charge',
  deposit: 'Deposit',
  levy: 'Levy',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);

const PAGE_SIZE = 10;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export default function ResidentDuesPage() {
  const queryClient = useQueryClient();
  const [payError, setPayError] = useState<{ dueId: string; message: string } | null>(null);
  const providers = usePaymentProviders();
  const serviceCharges = useQuery({
    queryKey: estateResidentKeys.serviceCharges,
    queryFn: () => unwrap(residentServiceChargesService.list()),
  });
  const [payingDueId, setPayingDueId] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const [unpaidPage, setUnpaidPage] = useState(1);
  const [settledPage, setSettledPage] = useState(1);
  const summary = useQuery({
    queryKey: estateResidentKeys.duesSummary,
    queryFn: () => unwrap(estateResidentService.getMyDuesSummary()),
  });
  const unpaid = useQuery({
    queryKey: [...estateResidentKeys.dues(unpaidPage), 'unpaid'],
    queryFn: () =>
      unwrap(
        estateResidentService.listMyDues({ scope: 'unpaid', page: unpaidPage, pageSize: PAGE_SIZE })
      ),
  });
  const settled = useQuery({
    queryKey: [...estateResidentKeys.dues(settledPage), 'settled'],
    queryFn: () =>
      unwrap(
        estateResidentService.listMyDues({
          scope: 'settled',
          page: settledPage,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const dues = unpaid.data?.items ?? [];
  const history = settled.data?.items ?? [];
  const isLoading = unpaid.isPending || settled.isPending;
  const nothingAtAll = !isLoading && (unpaid.data?.total ?? 0) + (settled.data?.total ?? 0) === 0;

  const payMutation = useMutation({
    mutationFn: ({ dueId, provider }: { dueId: string; provider?: PaymentProvider }) =>
      unwrap(estateResidentService.payMyDue(dueId, provider)),
    onMutate: () => setProviderError(null),
    onSuccess: (updated) => {
      setPayError(null);
      if (updated.authorizationUrl) {
        window.location.href = updated.authorizationUrl;
        return;
      }
      setPayingDueId(null);
      queryClient.invalidateQueries({ queryKey: estateResidentKeys.duesAll });
    },
    onError: (err, { dueId, provider }) => {
      const unavailable = providers.recover(err, provider);
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      setPayingDueId(null);
      setPayError({
        dueId,
        message: err instanceof Error ? err.message : 'Unable to start payment. Please try again.',
      });
    },
  });
  const renderDue = (due: Due) => {
    const isPaying = payMutation.isPending && payMutation.variables?.dueId === due.id;
    const canPay =
      due.status === 'pending' || due.status === 'overdue' || due.status === 'processing';
    return (
      <div key={due.id} className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
              {categoryLabels[due.category]}
              {due.isRecurring && (
                <span title="Repeats automatically">
                  <Repeat
                    className="w-3 h-3 text-muted-foreground shrink-0"
                    aria-label="Repeats automatically"
                  />
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Due {formatDate(due.dueDate)}
              {due.description ? ` · ${due.description}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(due.amount)}
            </span>
            <Badge variant={statusVariant[due.status]}>
              {due.status.charAt(0).toUpperCase() + due.status.slice(1)}
            </Badge>
            {canPay && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isPaying}
                loadingText="Processing…"
                onClick={() => {
                  setPayError(null);
                  setPayingDueId(due.id);
                }}
              >
                {due.status === 'processing' ? 'Finish paying' : 'Pay now'}
              </Button>
            )}
          </div>
        </div>
        {payError?.dueId === due.id && (
          <p className="text-xs text-destructive mt-2">{payError.message}</p>
        )}
      </div>
    );
  };

  const payingDue = dues.find((due) => due.id === payingDueId) ?? null;
  const closePayDialog = () => {
    setPayingDueId(null);
    setProviderError(null);
  };

  return (
    <>
      <PageHeader
        title="Dues"
        description={
          summary.data
            ? summary.data.outstandingCount === 0
              ? 'Nothing to pay right now'
              : `${formatCurrency(summary.data.outstandingTotal)} to pay across ${summary.data.outstandingCount} ${summary.data.outstandingCount === 1 ? 'due' : 'dues'}${summary.data.overdueCount > 0 ? `, ${summary.data.overdueCount} overdue` : ''}`
            : 'Loading…'
        }
      />

      {(serviceCharges.data?.length ?? 0) > 0 && (
        <div className="mb-8">
          <ServiceChargesTab
            charges={serviceCharges.data ?? []}
            hrefFor={(id) => `/resident/dues/service-charges/${id}`}
            intro="Your household's share of the estate's shared costs. Pay each one below with your other dues. Open one to see how it was worked out or to raise a query."
          />
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : nothingAtAll ? (
        <EmptyState
          icon={ReceiptText}
          title="No dues yet"
          description="Your estate manager hasn't charged any dues to your household."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">To pay</h2>
            {dues.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                You&apos;re up to date. New charges appear here.
              </p>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="divide-y divide-border">{dues.map(renderDue)}</div>
                {(unpaid.data?.total ?? 0) > PAGE_SIZE && (
                  <Pagination
                    page={unpaidPage}
                    pageSize={PAGE_SIZE}
                    total={unpaid.data?.total ?? 0}
                    onPageChange={setUnpaidPage}
                  />
                )}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">History</h2>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="divide-y divide-border">{history.map(renderDue)}</div>
                {(settled.data?.total ?? 0) > PAGE_SIZE && (
                  <Pagination
                    page={settledPage}
                    pageSize={PAGE_SIZE}
                    total={settled.data?.total ?? 0}
                    onPageChange={setSettledPage}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      )}

      <PayDialog
        open={!!payingDue}
        onClose={closePayDialog}
        title="Pay dues"
        context={
          payingDue
            ? `${categoryLabels[payingDue.category]}${payingDue.description ? ` · ${payingDue.description}` : ''}`
            : undefined
        }
        dueDate={payingDue?.dueDate}
        overdue={payingDue?.status === 'overdue'}
        owed={payingDue?.amount ?? 0}
        itemLabel={payingDue ? categoryLabels[payingDue.category] : 'Dues'}
        receiverLine={`The fee goes to the payment company, so your estate receives the full ${formatCurrency(payingDue?.amount ?? 0)}.`}
        protection="Your payment goes to your estate."
        providers={providers}
        providerError={providerError}
        busy={payMutation.isPending}
        onPay={() =>
          payingDue && payMutation.mutate({ dueId: payingDue.id, provider: providers.provider })
        }
      />
    </>
  );
}
