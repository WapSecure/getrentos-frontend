'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Landmark } from 'lucide-react';
import { Badge, Button, Pagination, type BadgeVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
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
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: account } = useQuery({
    queryKey: sellerPayoutKeys.account,
    queryFn: () => unwrap(sellerPayoutService.getAccount()),
  });

  const { data: payouts } = useQuery({
    queryKey: [...sellerPayoutKeys.payouts, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(sellerPayoutService.listSalePayouts({ page, pageSize: PAGE_SIZE })),
  });

  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;

  const save = useMutation({
    mutationFn: () => unwrap(sellerPayoutService.updateAccount({ bankCode, accountNumber })),
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
      <h2 className="text-xl font-semibold text-foreground mb-4">Payout Account</h2>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>

      {account?.accountNumber ? (
        <div className="rounded-lg border border-border p-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            {account.bankName} · {account.accountNumber} · {account.accountName}
          </p>
          {account.verified ? (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">
                Bank account verified and active for payouts
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Not yet verified — save it again to resolve it against your bank.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            To change it, enter new details below and save.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-6">
          No payout account yet. Add one so sale proceeds can be sent to you once escrow releases.
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="seller-payout-bank-code"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Bank Code
          </label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="seller-payout-bank-code"
              type="text"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              placeholder="e.g. 058 for GTBank"
              maxLength={6}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="seller-payout-account-number"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Account Number
          </label>
          <input
            id="seller-payout-account-number"
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="0123456789"
            maxLength={10}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          variant="primary"
          isLoading={save.isPending}
          disabled={!canSave || save.isPending}
          onClick={() => save.mutate()}
        >
          Update Payout Account
        </Button>
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <h3 className="text-base font-semibold text-foreground">Sale payouts</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Sales whose escrow has released, and whether the money has reached your account.
        </p>

        {sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">No released sales yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {sales.map((sale: SellerSalePayout) => {
              const meta = STATUS_META[sale.payoutStatus];
              return (
                <li
                  key={sale.transactionId}
                  className="flex items-center justify-between gap-3 p-3"
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
