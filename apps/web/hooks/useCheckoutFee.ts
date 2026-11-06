import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { paymentKeys } from '@/lib/queryKeys';
import { getCheckoutFee } from '@/services/paymentStatusService';

/**
 * The card or bank fee the payer covers on a payment of `amount` whole naira,
 * and the total they will be asked for. The payer pays it so the landlord,
 * seller or estate receives the full amount. Nothing is fetched for 0.
 */
export function useCheckoutFee(amount: number) {
  const valid = Number.isInteger(amount) && amount > 0;
  const query = useQuery({
    queryKey: paymentKeys.checkoutFee(valid ? amount : 0),
    queryFn: () => unwrap(getCheckoutFee(amount)),
    enabled: valid,
    staleTime: 5 * 60_000,
  });
  return {
    fee: query.data ? query.data.feeKobo / 100 : null,
    total: query.data ? query.data.totalKobo / 100 : null,
  };
}
