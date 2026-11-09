'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Landmark, Wallet } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Skeleton,
  TableSkeleton,
  type BadgeVariant,
  type Column,
  type ToastVariant,
} from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agencyCommissionService, type AgencyPayout } from '@/services/agencyCommissionService';
import {
  PAYOUT_CHANGE_COOLDOWN_HINT,
  PayoutHoldNotice,
} from '@/components/shared/payouts/PayoutHoldNotice';
import { BankAccountFields } from '@/components/shared/payouts/BankAccountFields';
import { payoutDestination } from '@/lib/payoutDestination';
import { PayoutRowDetails } from '@/components/shared/payouts/PayoutRowDetails';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  lookupAllowsSave,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  withdrawStepUpSummary,
  withStepUpSummary,
  type AccountLookup,
} from '@sureground/shared';

const PAYOUT_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Processing', variant: 'info' },
  SUCCESS: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

const PAYOUT_COLUMNS: Column<AgencyPayout>[] = [
  {
    key: 'requested',
    header: 'Requested',
    className: 'text-muted-foreground',
    render: (p) => formatDate(p.createdAt),
  },
  {
    key: 'commissions',
    header: 'Commissions',
    numeric: true,
    className: 'text-muted-foreground',
    render: (p) => p.commissions,
  },
  {
    key: 'amount',
    header: 'Amount',
    numeric: true,
    className: 'font-medium text-foreground',
    render: (p) => formatCurrency(p.amount),
  },
  {
    key: 'status',
    header: 'Status',
    className: 'min-w-56',
    render: (p) => {
      const pill = PAYOUT_STATUS[p.status] ?? {
        label: p.status,
        variant: 'neutral' as BadgeVariant,
      };
      return (
        <>
          <Badge variant={pill.variant}>{pill.label}</Badge>
          <PayoutRowDetails
            state={p.status === 'SUCCESS' ? 'paid' : p.status === 'FAILED' ? 'failed' : 'pending'}
            paidAt={p.paidAt}
            transferRef={p.transferRef}
            failureReason={p.failureReason}
            sentTo={p.sentTo}
          />
        </>
      );
    },
  },
];

export function AgencyPayoutSection({
  onToast,
}: {
  onToast: (message: string, variant: ToastVariant) => void;
}) {
  const queryClient = useQueryClient();
  const [editingAccount, setEditingAccount] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  // Money moves only after the amount and the account it goes to are confirmed.
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  const accountQuery = useQuery({
    queryKey: ['agency', 'payoutAccount'],
    queryFn: () => unwrap(agencyCommissionService.getPayoutAccount()),
  });
  const summaryQuery = useQuery({
    queryKey: ['agency', 'payoutSummary'],
    queryFn: () => unwrap(agencyCommissionService.payoutSummary()),
  });
  const payoutsQuery = useQuery({
    queryKey: ['agency', 'payouts'],
    queryFn: () => unwrap(agencyCommissionService.listPayouts()),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['agency', 'payoutAccount'] });
    queryClient.invalidateQueries({ queryKey: ['agency', 'payoutSummary'] });
    queryClient.invalidateQueries({ queryKey: ['agency', 'payouts'] });
    queryClient.invalidateQueries({ queryKey: ['agency', 'commissions'] });
  };

  const saveAccount = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
        }),
        () => unwrap(agencyCommissionService.savePayoutAccount({ bankCode, accountNumber }))
      ),
    onSuccess: () => {
      setEditingAccount(false);
      setBankCode('');
      setAccountNumber('');
      refresh();
      onToast('Payout account saved.', 'success');
    },
    onError: (e: Error) => onToast(e.message || 'Could not save the account.', 'error'),
  });

  const withdraw = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        withdrawStepUpSummary(formatCurrency(summaryQuery.data?.available ?? 0), accountQuery.data),
        () => unwrap(agencyCommissionService.requestPayout())
      ),
    onSuccess: () => {
      refresh();
      onToast('Payout requested.', 'success');
    },
    onError: (e: Error) => onToast(e.message || 'Could not request a payout.', 'error'),
  });

  const account = accountQuery.data;
  const summary = summaryQuery.data;
  const canSave = lookupAllowsSave(lookup);
  const canWithdraw = Boolean(summary?.accountSet) && (summary?.available ?? 0) > 0;

  return (
    <div className="mt-8">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        Payouts
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            Payout account
          </h3>
          {accountQuery.isLoading ? (
            <div role="status" aria-label="Loading" className="mt-3 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : !editingAccount && account?.verified ? (
            <div className="mt-3">
              <p className="text-sm text-foreground">
                {payoutAccountLabel({ ...account, bankName: account.bankName || 'Bank' })}
              </p>
              {account.accountName && (
                <p className="text-xs text-muted-foreground">{account.accountName}</p>
              )}
              <PayoutHoldNotice holdUntil={account.payoutHoldUntil} />
              <p className="mt-2 text-xs text-muted-foreground">{PAYOUT_CHANGE_COOLDOWN_HINT}</p>
              <Button variant="secondary" className="mt-3" onClick={() => setEditingAccount(true)}>
                Replace
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <BankAccountFields
                idPrefix="agency-payout"
                bankCode={bankCode}
                onBankCode={setBankCode}
                accountNumber={accountNumber}
                onAccountNumber={setAccountNumber}
                onLookup={setLookup}
              />
              {account?.verified && (
                <p className="text-xs text-muted-foreground">{PAYOUT_CHANGE_COOLDOWN_HINT}</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => saveAccount.mutate()}
                  disabled={!canSave}
                  isLoading={saveAccount.isPending}
                >
                  {saveAccountLabel(lookup, 'Save account')}
                </Button>
                {account?.verified && (
                  <Button
                    variant="ghost"
                    onClick={() => setEditingAccount(false)}
                    disabled={saveAccount.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            Available to withdraw
          </h3>
          {summaryQuery.isLoading ? (
            <Skeleton className="mt-3 h-8 w-32" />
          ) : (
            <p className="mt-3 text-2xl font-bold text-foreground">
              {summary ? formatCurrency(summary.available) : '—'}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Commission the owners&apos; rent has covered, not yet paid out.
          </p>
          {summary && summary.awaitingOwnerFunds > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(summary.awaitingOwnerFunds)} more is waiting for owners&apos; rent to
              arrive.
            </p>
          ) : null}
          <Button
            className="mt-3"
            onClick={() => setConfirmingWithdraw(true)}
            disabled={!canWithdraw}
            isLoading={withdraw.isPending}
            loadingText="Requesting…"
          >
            Withdraw
          </Button>
          {!summary?.accountSet && (
            <p className="mt-2 text-xs text-muted-foreground">Add a payout account to withdraw.</p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmingWithdraw}
        onOpenChange={setConfirmingWithdraw}
        tone="primary"
        title={`Withdraw ${formatCurrency(summary?.available ?? 0)}?`}
        description={`${formatCurrency(summary?.available ?? 0)} will be sent to ${
          account ? payoutDestination(account) : 'your payout account'
        }. Check this is your account before you continue.`}
        confirmLabel={`Withdraw ${formatCurrency(summary?.available ?? 0)}`}
        onConfirm={() => withdraw.mutate()}
      />

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Payout history</h3>
        {payoutsQuery.isLoading ? (
          <TableSkeleton rows={3} columns={4} />
        ) : !payoutsQuery.data || payoutsQuery.data.length === 0 ? (
          <EmptyState icon={Banknote} title="No payouts yet." size="compact" />
        ) : (
          <DataTable
            caption="Payout history"
            density="compact"
            columns={PAYOUT_COLUMNS}
            data={payoutsQuery.data}
            getRowKey={(p) => p.id}
          />
        )}
      </div>
    </div>
  );
}
