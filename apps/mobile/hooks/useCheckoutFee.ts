import { useQuery } from '@tanstack/react-query';
import { paymentStatusApi, type PaymentProvider } from '@/lib/api/paymentStatus';
import { qk } from '@/lib/query/keys';

/**
 * Where the fee lookup stands: `none` (nothing to look up), `loading`, `ready`
 * (`fee` and `total` known) or `unknown` (the lookup failed, or the amount has
 * kobo, which the fee lookup does not take). When unknown the payer sees the
 * fee on the payment company's page, so no total may be promised.
 */
export type CheckoutFeeState = 'none' | 'loading' | 'ready' | 'unknown';

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
