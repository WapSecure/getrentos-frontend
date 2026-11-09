import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { paymentKeys } from '@/lib/queryKeys';
import { getCheckoutFee, getProviderFee } from '@/services/paymentStatusService';
import type { PaymentProvider } from '@/types/payments';

// `unknown`: the lookup failed or the amount is finer than a kobo; the payer sees the fee on the provider's page, so no total may be promised.
export type CheckoutFeeState = 'none' | 'loading' | 'ready' | 'unknown';

// The payer covers the fee so the landlord, seller or estate receives the full amount.
export function useCheckoutFee(amount: number, provider?: PaymentProvider | null) {
  // Anything finer than a kobo cannot be paid.
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
    retry: valid && query.isError ? () => void query.refetch() : undefined,
    retrying: query.isFetching,
  };
}
