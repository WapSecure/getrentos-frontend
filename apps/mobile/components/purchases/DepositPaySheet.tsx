import { useState } from 'react';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@sureground/ui-native';
import { buyerTransactionsApi, type BuyerTransaction } from '@/lib/api/buyerTransactions';
import type { PaymentProvider } from '@/lib/api/paymentStatus';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { SALE_DEPOSIT_PROTECTION } from '@/lib/paymentCopy';
import { PaySheet } from '@/components/payments/PaySheet';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { useDepositIdentityNotice } from '@/components/purchases/DepositIdentityNotice';

/**
 * Paying a sale's deposit into Payment Protection: the provider choice, the checkout and what to
 * say afterwards. Used by the transactions list and the purchase workspace.
 */
export function DepositPaySheet({
  tx,
  open,
  onClose,
  onSettled,
}: {
  /** Kept by the caller while the sheet slides away. */
  tx: BuyerTransaction | null;
  open: boolean;
  onClose: () => void;
  /** After the checkout returns or the payment is recorded, so the caller can refresh. */
  onSettled: () => void;
}) {
  const toast = useToast();
  const checkout = usePaystackCheckout();
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);
  const close = () => {
    setProviderError(null);
    onClose();
  };
  const deposit = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider?: PaymentProvider }) =>
      buyerTransactionsApi.deposit(id, provider),
    onMutate: () => setProviderError(null),
    onSuccess: async (paid) => {
      close();
      trackShowroom({
        name: 'payment_started',
        market: 'sale',
        surface: 'app_purchase',
        props: { kind: 'deposit' },
      });
      if (paid.authorizationUrl) await checkout(paid.authorizationUrl, paid.reference);
      else if (paid.escrowStatus === 'funds_held')
        toast.show(`Paid.${paid.reference ? ` Reference ${paid.reference}.` : ''}`, 'success');
      else toast.show('We’re confirming your deposit. This purchase shows when it’s paid.', 'info');
      onSettled();
    },
    onError: (err, { provider }) => {
      const unavailable = providers.recover(err, provider);
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      close();
      toast.show(errorMessage(err, 'Could not start this deposit.'), 'error');
    },
  });
  const amount = tx ? (tx.depositAmount ?? tx.purchasePrice) : 0;
  const identityNotice = useDepositIdentityNotice(open && !!tx, close);

  return (
    <PaySheet
      open={open && !!tx}
      onClose={close}
      title="Pay deposit"
      context={tx ? `${tx.propertyTitle} · Seller: ${tx.ownerName}` : null}
      owed={amount}
      owedLabel="to pay"
      amount={amount}
      itemLabel="Deposit"
      receiverLine={`The fee goes to the payment company, so the full ${formatNaira(amount)} is held for the seller.`}
      protection={SALE_DEPOSIT_PROTECTION}
      providers={providers}
      providerError={providerError}
      busy={deposit.isPending}
      blocked={identityNotice}
      onPay={() => tx && deposit.mutate({ id: tx.id, provider: providers.provider })}
    />
  );
}
