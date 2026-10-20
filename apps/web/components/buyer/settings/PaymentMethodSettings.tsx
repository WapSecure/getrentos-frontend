'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
import { Alert, Button, Field, Input, NumberInput, useToast } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';

export const PaymentMethodSettings = () => {
  const queryClient = useQueryClient();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verified, setVerified] = useState(false);
  const toast = useToast();

  const { data: account } = useQuery({
    queryKey: buyerKeys.paymentMethod,
    queryFn: () => unwrap(buyerService.getPaymentMethod()),
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
      unwrap(buyerService.updatePaymentMethod({ bankName, accountNumber, accountName })),
    onSuccess: (result) => {
      setVerified(result.verified);
      queryClient.invalidateQueries({ queryKey: buyerKeys.paymentMethod });
      toast.success('Payment method updated and verified.');
    },
    onError: (error) => toast.error(error.message || 'Unable to update your payment method.'),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payment Method</h2>
      <p className="text-sm text-muted-foreground mb-6">
        The account you pay deposits and balances from
      </p>

      {verified ? (
        <Alert variant="success" className="mb-6">
          Bank account verified and active for protected payments
        </Alert>
      ) : (
        <p className="text-xs text-muted-foreground mb-6">
          Add your bank details: your account will be marked as verified once you save.
        </p>
      )}

      <div className="space-y-4">
        <Field label="Bank Name">
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g. GTBank"
            leadingIcon={<Landmark className="h-4 w-4" />}
          />
        </Field>
        <Field label="Account Number">
          <NumberInput
            value={accountNumber}
            onValueChange={setAccountNumber}
            placeholder="0123456789"
          />
        </Field>
        <Field label="Account Name">
          <Input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Name on the account"
          />
        </Field>
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        isLoading={save.isPending}
        disabled={!bankName || !accountNumber || !accountName || save.isPending}
        onClick={() => save.mutate()}
      >
        Update Payment Method
      </Button>
    </div>
  );
};
