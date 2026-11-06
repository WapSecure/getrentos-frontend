import { useQuery } from '@tanstack/react-query';
import { paymentStatusApi } from '@/lib/api/paymentStatus';
import { qk } from '@/lib/query/keys';

/**
 * The card or bank fee the payer covers on a payment of `amount` whole naira,
 * and the total they will be asked for on Paystack. Nothing is fetched for 0.
 */
export function useCheckoutFee(amount: number) {
  const valid = Number.isInteger(amount) && amount > 0;
  const query = useQuery({
    queryKey: qk.checkoutFee(valid ? amount : 0),
    queryFn: () => paymentStatusApi.checkoutFee(amount),
    enabled: valid,
    staleTime: 5 * 60_000,
  });
  return {
    fee: query.data ? query.data.feeKobo / 100 : null,
    total: query.data ? query.data.totalKobo / 100 : null,
  };
}
