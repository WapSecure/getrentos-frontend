'use client';

import { LegacyInput, NumberInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, CheckCircle2 } from 'lucide-react';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

export const PayoutSettings = () => {
  const queryClient = useQueryClient();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verified, setVerified] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: account } = useQuery({
    queryKey: realtorKeys.settingsPayout,
    queryFn: () => unwrap(realtorService.getPayoutAccount()),
  });

  useEffect(() => {
    if (!account) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBankName(account.bankName || '');

    setAccountNumber(account.accountNumber || '');

    setAccountName(account.accountName || '');

    setVerified(account.verified);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.bankName, account?.accountNumber, account?.accountName, account?.verified]);

  const save = useMutation({
    mutationFn: () =>
      unwrap(realtorService.updatePayoutAccount({ bankName, accountNumber, accountName })),
    onSuccess: (result) => {
      setVerified(result.verified);
      queryClient.invalidateQueries({ queryKey: realtorKeys.settingsPayout });
      setToast({ message: 'Payout account updated and verified.', variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to update your payout account.',
        variant: 'error',
      }),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payout Account</h2>
      <p className="text-sm text-muted-foreground mb-6">Where your commission payouts are sent</p>

      {verified ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-6">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-400">
            Bank account verified and active for payouts
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-6">
          Add your bank details — your account will be marked as verified once you save.
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bank Name</label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <LegacyInput
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. GTBank"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
          <NumberInput
            value={accountNumber}
            onValueChange={setAccountNumber}
            placeholder="0123456789"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Account Name</label>
          <LegacyInput
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Name on the account"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        isLoading={save.isPending}
        disabled={!bankName || !accountNumber || !accountName || save.isPending}
        onClick={() => save.mutate()}
      >
        Update Payout Account
      </Button>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
