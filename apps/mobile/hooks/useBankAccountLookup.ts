import { useQuery } from '@tanstack/react-query';
import { paymentStatusApi } from '@/lib/api/paymentStatus';
import { qk } from '@/lib/query/keys';

export const accountNumberOk = (n: string) => /^\d{10}$/.test(n);
/** Bank codes run 3 to 9 digits; leading zeros are kept. */
export const bankCodeOk = (c: string) => /^\d{3,9}$/.test(c);

/** Undefined while loading or on failure; callers fall back to a built-in list. */
export function useBanks() {
  return useQuery({
    queryKey: qk.banks,
    queryFn: paymentStatusApi.banks,
    staleTime: 60 * 60_000,
    throwOnError: false,
  });
}

/** A failure is shown under the field, never retried or thrown. */
export function useAccountName(bankCode: string, accountNumber: string) {
  const ready = bankCodeOk(bankCode) && accountNumberOk(accountNumber);
  const query = useQuery({
    queryKey: qk.accountName(bankCode, accountNumber),
    queryFn: () => paymentStatusApi.resolveBankAccount({ bankCode, accountNumber }),
    enabled: ready,
    retry: false,
    throwOnError: false,
    staleTime: 10 * 60_000,
  });
  return {
    ready,
    checking: ready && query.isFetching,
    accountName: ready ? (query.data?.accountName ?? null) : null,
    error: ready && query.isError ? query.error : null,
  };
}
