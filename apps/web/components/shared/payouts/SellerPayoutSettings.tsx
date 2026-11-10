'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2 } from '@sureground/icons';
import {
  Alert,
  Badge,
  EmptyState,
  ListSkeleton,
  Pagination,
  SaveButton,
  type BadgeVariant,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PAYOUT_FAILED_NEXT_STEP,
  payoutSentToLabel,
  lookupAllowsSave,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  withStepUpSummary,
  type AccountLookup,
} from '@sureground/shared';
import { BankAccountFields } from './BankAccountFields';
import { PayoutHoldNotice } from './PayoutHoldNotice';
import { sellerPayoutKeys } from '@/lib/queryKeys';
import {
  sellerPayoutService,
  type SellerPayoutStatus,
  type SellerSalePayout,
} from '@/services/sellerPayoutService';

const PAGE_SIZE = 5;

const STATUS_META: Record<SellerPayoutStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Waiting for payout account', variant: 'warning' },
  PROCESSING: { label: 'On its way', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
};

interface SellerPayoutSettingsProps {
  description: string;
}

export const SellerPayoutSettings = ({ description }: SellerPayoutSettingsProps) => {
  const queryClient = useQueryClient();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: account } = useQuery({
    queryKey: sellerPayoutKeys.account,
    queryFn: () => unwrap(sellerPayoutService.getAccount()),
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: [...sellerPayoutKeys.payouts, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(sellerPayoutService.listSalePayouts({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });

  const canSave = lookupAllowsSave(lookup);
  // PENDING waits on the seller only when there is no verified account; otherwise it is queued for the next payout run.
  const pendingMeta = account?.verified
    ? { label: 'Queued for the next hourly payout', variant: 'info' as BadgeVariant }
    : STATUS_META.PENDING;

  const save = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
        }),
        () => unwrap(sellerPayoutService.updateAccount({ bankCode, accountNumber }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerPayoutKeys.account });
      setBankCode('');
      setAccountNumber('');
      setError(null);
    },
    onError: (err: Error) => setError(err.message || 'Unable to update your payout account.'),
  });

  const sales = payouts?.items ?? [];
  const total = payouts?.total ?? 0;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payout account</h2>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>

      {account?.accountNumber ? (
        <div className="rounded-lg border border-border p-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            {payoutAccountLabel(account)} · {account.accountName}
          </p>
          {account.verified ? (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <p className="text-xs text-success">Bank account verified and active for payouts</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Not yet verified: save it again to resolve it against your bank.
            </p>
          )}
          <PayoutHoldNotice holdUntil={account.payoutHoldUntil} />
          <p className="mt-2 text-xs text-muted-foreground">
            To change it, enter new details below and save. {PAYOUT_CHANGE_COOLDOWN_HINT}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-6">
          No payout account yet. Add one so sale money can be sent to you once Sureground pays it
          out.
        </p>
      )}

      <div>
        <BankAccountFields
          idPrefix="seller-payout"
          bankCode={bankCode}
          onBankCode={setBankCode}
          accountNumber={accountNumber}
          onAccountNumber={setAccountNumber}
          onLookup={setLookup}
        />
      </div>

      <div className="mt-6 space-y-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <SaveButton
          label={saveAccountLabel(
            lookup,
            account?.accountNumber ? 'Update payout account' : 'Save payout account'
          )}
          disabled={!canSave}
          onClick={() => save.mutateAsync()}
        />
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <h3 className="text-base font-semibold text-foreground">Sale payouts</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Sales Sureground has paid out, and whether the money has reached your account. Queued
          sales are sent in the hourly payout run; a newly changed account waits 24 hours first.
        </p>

        {payoutsLoading ? (
          <ListSkeleton rows={3} />
        ) : sales.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No released sales yet"
            description="Once Sureground pays out a sale, it will appear here with its payout status."
            size="compact"
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {sales.map((sale: SellerSalePayout) => {
              const meta =
                sale.payoutStatus === 'PENDING' ? pendingMeta : STATUS_META[sale.payoutStatus];
              return (
                <li
                  key={sale.transactionId}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sale.propertyTitle ?? 'Property sale'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sale.payoutStatus === 'PAID' && sale.paidAt
                        ? `Paid ${formatDate(sale.paidAt)}`
                        : sale.releasedAt
                          ? `Released ${formatDate(sale.releasedAt)}`
                          : 'Released'}
                    </p>
                    {payoutSentToLabel(sale.sentTo) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {payoutSentToLabel(sale.sentTo)}
                      </p>
                    )}
                    {/* The API sends no reason for a failed sale payout, so say what happens next. */}
                    {sale.payoutStatus === 'FAILED' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {PAYOUT_FAILED_NEXT_STEP}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(sale.amount)}
                    </span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {total > PAGE_SIZE && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            className="mt-4"
          />
        )}
      </div>
    </div>
  );
};
