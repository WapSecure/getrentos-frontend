'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Landmark } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Field,
  ListSkeleton,
  NumberInput,
  Pagination,
  Select,
  type BadgeVariant,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { NIGERIAN_BANKS } from '@/lib/banks';
import { sellerPayoutKeys } from '@/lib/queryKeys';
import {
  sellerPayoutService,
  type SellerPayoutStatus,
  type SellerSalePayout,
} from '@/services/sellerPayoutService';

const PAGE_SIZE = 5;

const OTHER_BANK = 'other';
const BANK_OPTIONS = [
  ...NIGERIAN_BANKS.map((b) => ({ value: b.code, label: b.name })),
  { value: OTHER_BANK, label: 'Other bank (enter its code)' },
];

const STATUS_META: Record<SellerPayoutStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Waiting for payout account', variant: 'warning' },
  PROCESSING: { label: 'On its way', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
};

interface SellerPayoutSettingsProps {
  /** One line under the heading, in the persona's own words. */
  description: string;
}

/**
 * The payout account marketplace sale proceeds are sent to, and where each sale's
 * payout stands. Shared by every persona that can sell on the marketplace
 * (Property Owner, Realtor, Agent): they sell through the same seller API, so
 * there is one account and one list, whichever dashboard they open it from.
 */
export const SellerPayoutSettings = ({ description }: SellerPayoutSettingsProps) => {
  const queryClient = useQueryClient();
  const [bank, setBank] = useState('');
  const [otherBankCode, setOtherBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
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

  const bankCode = bank === OTHER_BANK ? otherBankCode.trim() : bank;
  const canSave = bankCode.length >= 3 && accountNumber.trim().length === 10;
  const accountNumberError =
    accountNumber.length > 0 && accountNumber.length < 10
      ? 'Account numbers are 10 digits (NUBAN).'
      : undefined;
  // PENDING only waits on the seller when there is no verified account yet;
  // otherwise it is queued for the next payout run.
  const pendingMeta = account?.verified
    ? { label: 'Queued for the next payout run', variant: 'info' as BadgeVariant }
    : STATUS_META.PENDING;

  const save = useMutation({
    mutationFn: () => unwrap(sellerPayoutService.updateAccount({ bankCode, accountNumber })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerPayoutKeys.account });
      setBank('');
      setOtherBankCode('');
      setAccountNumber('');
      setError(null);
    },
    onError: (err: Error) => setError(err.message || 'Unable to update your payout account.'),
  });

  const sales = payouts?.items ?? [];
  const total = payouts?.total ?? 0;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payout Account</h2>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>

      {account?.accountNumber ? (
        <div className="rounded-lg border border-border p-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            {account.bankName} · {account.accountNumber} · {account.accountName}
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
          <p className="mt-2 text-xs text-muted-foreground">
            To change it, enter new details below and save.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-6">
          No payout account yet. Add one so sale money can be sent to you once GetRentos pays it
          out.
        </p>
      )}

      <div className="space-y-4">
        <Field label="Bank" htmlFor="seller-payout-bank">
          <Select
            id="seller-payout-bank"
            value={bank}
            onValueChange={setBank}
            options={BANK_OPTIONS}
            placeholder="Choose your bank"
            searchable
            searchPlaceholder="Search banks"
          />
        </Field>
        {bank === OTHER_BANK && (
          <Field label="Bank Code" htmlFor="seller-payout-bank-code">
            <NumberInput
              value={otherBankCode}
              onValueChange={setOtherBankCode}
              placeholder="Your bank's code"
              maxLength={6}
              leadingIcon={<Landmark className="w-4 h-4" />}
            />
          </Field>
        )}
        <Field
          label="Account Number"
          htmlFor="seller-payout-account-number"
          hint="Your 10-digit NUBAN account number."
          error={accountNumberError}
        >
          <NumberInput
            value={accountNumber}
            onValueChange={setAccountNumber}
            placeholder="0123456789"
            maxLength={10}
          />
        </Field>
      </div>

      <div className="mt-6 space-y-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <Button
          variant="primary"
          isLoading={save.isPending}
          disabled={!canSave}
          onClick={() => save.mutate()}
        >
          Update Payout Account
        </Button>
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <h3 className="text-base font-semibold text-foreground">Sale payouts</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Sales GetRentos has paid out, and whether the money has reached your account.
        </p>

        {payoutsLoading ? (
          <ListSkeleton rows={3} />
        ) : sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">No released sales yet.</p>
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
