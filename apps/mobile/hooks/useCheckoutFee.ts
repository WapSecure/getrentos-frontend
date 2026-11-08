import { useQuery } from '@tanstack/react-query';
import { paymentStatusApi, type PaymentProvider } from '@/lib/api/paymentStatus';
import { qk } from '@/lib/query/keys';

/**
 * Where the fee lookup stands: `none` (nothing to look up), `loading`, `ready`
 * (`fee` and `total` known) or `unknown` (the lookup failed, or the amount is
 * not a whole number of kobo). When unknown the payer sees the
 * fee on the payment company's page, so no total may be promised.
 */
export type CheckoutFeeState = 'none' | 'loading' | 'ready' | 'unknown';

/**
 * The card or bank fee the payer covers on a payment of `amount` naira (kobo allowed),
 * and the total they will be asked for. Fees differ per company: pass the
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
    queryKey: provider ? qk.providerFee(safeAmount, provider) : qk.checkoutFee(safeAmount),
    queryFn: () =>
      provider
        ? paymentStatusApi.providerFee(safeAmount, provider)
        : paymentStatusApi.checkoutFee(safeAmount),
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
