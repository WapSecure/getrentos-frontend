import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import { paymentKeys } from '@/lib/queryKeys';
import { getPaymentProviders } from '@/services/paymentStatusService';
import type { PaymentProvider, PaymentProviderOption } from '@/types/payments';

export const PAYMENT_PROVIDER_UNAVAILABLE = 'PAYMENT_PROVIDER_UNAVAILABLE';

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
    // Shown whenever there is more than one company, even if one is down, so the payer sees why it is greyed out.
    canChoose:
      options.filter((option) => option.available || option.reason !== 'is not set up').length > 1,
    recover,
  };
}

export type PaymentProviderChoice = ReturnType<typeof usePaymentProviders>;
