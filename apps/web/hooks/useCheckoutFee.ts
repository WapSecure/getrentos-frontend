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
 *   amount is not a whole number of kobo). The payer sees the
 *   fee on the payment company's page instead, so no total may be promised.
 */
export type CheckoutFeeState = 'none' | 'loading' | 'ready' | 'unknown';

/**
 * The card or bank fee the payer covers on a payment of `amount` naira (kobo allowed),
 * and the total they will be asked for. The payer pays it so the landlord,
 * seller or estate receives the full amount. Fees differ per company: pass the
 * payer's chosen `provider`; without one it is the default company's fee.
 * Nothing is fetched for 0.
 */
export function useCheckoutFee(amount: number, provider?: PaymentProvider | null) {
  // Kobo amounts get a real fee too (UX-3); anything finer than a kobo cannot be paid.
  const valid =
    Number.isFinite(amount) &&
    amount > 0 &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6;
  const safeAmount = valid ? Math.round(amount * 100) / 100 : 0;
  const query = useQuery({
    queryKey: provider
      ? paymentKeys.providerFee(safeAmount, provider)
      : paymentKeys.checkoutFee(safeAmount),
    queryFn: () =>
      unwrap(provider ? getProviderFee(safeAmount, provider) : getCheckoutFee(safeAmount)),
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
    /** Try the lookup again: only useful when it failed. */
    retry: valid && query.isError ? () => void query.refetch() : undefined,
    retrying: query.isFetching,
  };
}
