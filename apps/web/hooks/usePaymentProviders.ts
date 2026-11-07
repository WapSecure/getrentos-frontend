import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import { paymentKeys } from '@/lib/queryKeys';
import { getPaymentProviders } from '@/services/paymentStatusService';
import type { PaymentProvider, PaymentProviderOption } from '@/types/payments';

/** The API's code when the chosen company cannot take a payment right now (409). */
export const PAYMENT_PROVIDER_UNAVAILABLE = 'PAYMENT_PROVIDER_UNAVAILABLE';

/**
 * The company named in a "this provider is unavailable" refusal, and the
 * sentence to show, or null when `error` is any other failure.
 */
export function providerUnavailable(
  error: unknown
): { provider?: PaymentProvider; message: string } | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const body = (error.details ?? {}) as { code?: string; provider?: PaymentProvider };
  const matches =
    body.code === PAYMENT_PROVIDER_UNAVAILABLE ||
    error.code === PAYMENT_PROVIDER_UNAVAILABLE ||
    error.code === 'PaymentProviderUnavailableError';
  return matches ? { provider: body.provider, message: error.message } : null;
}

/**
 * Which company takes this payment: Paystack or Monnify, so a payer can switch
 * when one is down. Defaults to the first available one. `provider` is
 * undefined until the list loads (or when it cannot), and the pay route then
 * uses the default company.
 *
 * `recover(error, tried)` turns a 409 "provider unavailable" into the message to
 * show, marks that company unavailable here and moves the choice to the next
 * available one; it returns null for any other error.
 */
export function usePaymentProviders() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: paymentKeys.providers,
    queryFn: () => unwrap(getPaymentProviders()),
    staleTime: 60_000,
  });
  const [chosen, setChosen] = useState<PaymentProvider | null>(null);
  // Companies a pay call was just refused by, kept out of the choice even if the list was fetched before.
  const [refused, setRefused] = useState<PaymentProvider[]>([]);

  const options = useMemo<PaymentProviderOption[]>(
    () =>
      (query.data ?? []).map((option) =>
        option.available && refused.includes(option.provider)
          ? { ...option, available: false, reason: 'is having problems right now' }
          : option
      ),
    [query.data, refused]
  );
  const available = options.filter((option) => option.available);
  const provider = (available.find((option) => option.provider === chosen) ?? available[0])
    ?.provider;

  const recover = useCallback(
    (error: unknown, tried?: PaymentProvider | null): string | null => {
      const refusal = providerUnavailable(error);
      if (!refusal) return null;
      const failed = refusal.provider ?? tried;
      if (failed)
        setRefused((current) => (current.includes(failed) ? current : [...current, failed]));
      setChosen(null);
      void queryClient.invalidateQueries({ queryKey: paymentKeys.providers });
      return refusal.message;
    },
    [queryClient]
  );

  return {
    options,
    provider,
    choose: setChosen,
    /** More than one company can take it: worth asking. */
    canChoose: available.length > 1,
    recover,
  };
}

export type PaymentProviderChoice = ReturnType<typeof usePaymentProviders>;
