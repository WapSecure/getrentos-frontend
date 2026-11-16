export interface PaymentsForTotal {
  summary?: { totalPaidNaira?: number | null } | null;
  items?: { status: string; amount: number }[];
}

export type RentPaidFigure =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; naira: number };

export function rentPaidFigure(
  data: PaymentsForTotal | undefined,
  status: { isLoading: boolean; isError: boolean }
): RentPaidFigure {
  if (status.isLoading) return { state: 'loading' };
  if (status.isError || !data) return { state: 'error' };
  // The summary covers every charge; older APIs leave it out, so fall back to this page.
  const naira =
    data.summary?.totalPaidNaira ??
    (data.items ?? []).filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  return { state: 'ready', naira };
}
