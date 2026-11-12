// The renter dashboard's "Total rent paid": a money figure is shown only once the payments have
// loaded. Before that the card rendered "₦0", which read as a real balance.
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
