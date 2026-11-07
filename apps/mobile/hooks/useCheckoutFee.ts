import { useQuery } from '@tanstack/react-query';
import { paymentStatusApi, type PaymentProvider } from '@/lib/api/paymentStatus';
import { qk } from '@/lib/query/keys';

/**
 * The card or bank fee the payer covers on a payment of `amount` whole naira,
 * and the total they will be asked for. Fees differ per company: pass the
 * payer's chosen `provider`; without one it is the default company's fee.
 * Nothing is fetched for 0.
 */
export function useCheckoutFee(amount: number, provider?: PaymentProvider | null) {
  const valid = Number.isInteger(amount) && amount > 0;
  const safeAmount = valid ? amount : 0;
  const query = useQuery({
    queryKey: provider ? qk.providerFee(safeAmount, provider) : qk.checkoutFee(safeAmount),
    queryFn: () =>
      provider
        ? paymentStatusApi.providerFee(amount, provider)
        : paymentStatusApi.checkoutFee(amount),
    enabled: valid,
    staleTime: 5 * 60_000,
  });
  return {
    fee: query.data ? query.data.feeKobo / 100 : null,
    total: query.data ? query.data.totalKobo / 100 : null,
  };
}
