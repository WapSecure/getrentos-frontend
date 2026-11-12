'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from '@sureground/icons';
import {
  Pagination,
  QueryState,
  SearchInput,
  SegmentedControl,
  Skeleton,
  PageHeader,
  useToast,
} from '@sureground/ui';
import { BuyerEscrowTransactionCard } from '@/components/buyer/transactions/BuyerEscrowTransactionCard';
import { PayDialog } from '@/components/shared/payments/PayDialog';
import { useDepositIdentityNotice } from '@/components/shared/payments/DepositIdentityNotice';
import { formatCurrency } from '@/lib/format';
import { SALE_DEPOSIT_PROTECTION } from '@/lib/paymentCopy';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import type { BuyerEscrowStatus } from '@/types/buyer';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/types/payments';

type StatusFilter = 'all' | BuyerEscrowStatus;

export default function BuyerTransactionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  // The deposit is paid from the list; everything else lives on the purchase's workspace page.
  const [payingId, setPayingId] = useState<string | null>(null);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const transactionsQuery = useQuery({
    queryKey: [
      ...buyerKeys.transactions,
      { search: searchQuery, status: filter, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        buyerService.listTransactions({
          search: searchQuery || undefined,
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const { data: transactionsData, isLoading } = transactionsQuery;
  const transactions = transactionsData?.items ?? [];
  const total = transactionsData?.total ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: buyerKeys.transactions });

  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);
  const depositMutation = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider?: PaymentProvider }) =>
      unwrap(buyerService.depositTransaction(id, provider)),
    onMutate: () => setProviderError(null),
    onSuccess: (result) => {
      // The API reuses an open checkout, so a second click never creates a second charge.
      if (result.authorizationUrl) {
        window.location.assign(result.authorizationUrl);
        return;
      }
      invalidate();
    },
    onError: (reason: Error, { provider }) => {
      const unavailable = providers.recover(reason, provider);
      if (unavailable) setProviderError(unavailable);
      else toast.show(reason.message, 'error');
    },
  });
  const paying = transactions.find((t) => t.id === payingId) ?? null;
  const identityNotice = useDepositIdentityNotice(paying?.escrowStatus === 'deposit_pending');
  const payingDeposit = paying ? (paying.depositAmount ?? paying.purchasePrice) : 0;

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit pending' },
    { value: 'funds_held', label: 'Deposit held' },
    { value: 'released', label: 'Deposit released' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        description={
          isLoading ? (
            <Skeleton className="inline-block h-4 w-56 align-middle" />
          ) : (
            `${total} purchase${total === 1 ? '' : 's'}. Open one to follow its steps, approvals and legal transfer.`
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by property or owner..."
          label="Search transactions"
          className="flex-1 max-w-sm"
        />
        <SegmentedControl
          size="sm"
          aria-label="Filter by status"
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          segments={filterOptions}
          className="max-w-full overflow-x-auto"
        />
      </div>

      <QueryState
        isLoading={isLoading}
        isError={transactionsQuery.isError && !transactionsData}
        onRetry={() => void transactionsQuery.refetch()}
        isRetrying={transactionsQuery.isFetching}
        isEmpty={transactions.length === 0}
        empty={{
          icon: ShieldCheck,
          title:
            total === 0 ? 'No transactions match your filters' : 'No transactions on this page',
          description:
            total === 0
              ? 'Once an owner accepts your offer, the purchase and its protected payment will appear here.'
              : 'Choose another page to view more transactions.',
        }}
        scope="page"
        loading={
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {transactions.map((transaction, index) => (
            <BuyerEscrowTransactionCard
              key={transaction.id}
              transaction={transaction}
              delay={index * 0.05}
              onPayDeposit={() => setPayingId(transaction.id)}
            />
          ))}
        </div>
      </QueryState>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-8"
        />
      )}

      {paying && (
        <PayDialog
          open={paying.escrowStatus === 'deposit_pending'}
          onClose={() => {
            setPayingId(null);
            setProviderError(null);
          }}
          title="Pay deposit"
          context={`${paying.propertyTitle} · ${paying.ownerName}`}
          owed={payingDeposit}
          owedLabel="deposit"
          itemLabel="Deposit"
          receiverLine={`The fee goes to the payment company, so the full ${formatCurrency(payingDeposit)} is held for this purchase.`}
          protection={SALE_DEPOSIT_PROTECTION}
          providers={providers}
          providerError={providerError}
          busy={depositMutation.isPending}
          blocked={identityNotice}
          onPay={() => depositMutation.mutate({ id: paying.id, provider: providers.provider })}
        />
      )}
    </>
  );
}
