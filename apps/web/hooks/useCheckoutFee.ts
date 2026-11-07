import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { paymentKeys } from '@/lib/queryKeys';
import { getCheckoutFee, getProviderFee } from '@/services/paymentStatusService';
import type { PaymentProvider } from '@/types/payments';

/**
 * Where the fee lookup stands:
 * - `none`: nothing to look up (0);
 * - `loading`: being worked out;
 * - `ready`: `fee` and `total` are known;
 * - `unknown`: it could not be worked out here (the lookup failed, or the
 *   amount has kobo, which the fee lookup does not take). The payer sees the
 *   fee on the payment company's page instead, so no total may be promised.
 */
export type CheckoutFeeState = 'none' | 'loading' | 'ready' | 'unknown';

/**
 * The card or bank fee the payer covers on a payment of `amount` whole naira,
 * and the total they will be asked for. The payer pays it so the landlord,
 * seller or estate receives the full amount. Fees differ per company: pass the
 * payer's chosen `provider`; without one it is the default company's fee.
 * Nothing is fetched for 0.
 */
export function useCheckoutFee(amount: number, provider?: PaymentProvider | null) {
  const valid = Number.isInteger(amount) && amount > 0;
  const safeAmount = valid ? amount : 0;
  const query = useQuery({
    queryKey: provider
      ? paymentKeys.providerFee(safeAmount, provider)
      : paymentKeys.checkoutFee(safeAmount),
    queryFn: () => unwrap(provider ? getProviderFee(amount, provider) : getCheckoutFee(amount)),
    enabled: valid,
    staleTime: 5 * 60_000,
  });
  const state: CheckoutFeeState =
    amount <= 0
      ? 'none'
      : !valid || (query.isError && !query.data)
        ? 'unknown'
        : query.data
          ? 'ready'
          : 'loading';
  return {
    fee: query.data ? query.data.feeKobo / 100 : null,
    total: query.data ? query.data.totalKobo / 100 : null,
    state,
    /** Try the lookup again: only useful when it failed (not for an amount with kobo). */
    retry: valid && query.isError ? () => void query.refetch() : undefined,
    retrying: query.isFetching,
  };
}
