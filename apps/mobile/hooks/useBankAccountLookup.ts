import { useQuery } from '@tanstack/react-query';
import { paymentStatusApi } from '@/lib/api/paymentStatus';
import { qk } from '@/lib/query/keys';

/** A Nigerian account number is 10 digits (NUBAN). */
export const accountNumberOk = (n: string) => /^\d{10}$/.test(n);
/** Bank codes run 3 to 9 digits, leading zeros kept. */
export const bankCodeOk = (c: string) => /^\d{3,9}$/.test(c);

/**
 * Banks a payout can be sent to. Undefined while loading or when the list
 * could not be fetched; callers fall back to a built-in list.
 */
export function useBanks() {
  return useQuery({
    queryKey: qk.banks,
    queryFn: paymentStatusApi.banks,
    staleTime: 60 * 60_000,
    // Without the list the form still works from the built-in banks.
    throwOnError: false,
  });
}

/**
 * The name on a bank account, looked up once the code and the 10 digits are
 * complete. A failure is shown under the field and never retried or thrown.
 */
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
