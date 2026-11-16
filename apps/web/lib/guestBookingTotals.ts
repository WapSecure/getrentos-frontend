// Split like the booking quote (stay and refundable deposit): `total` on a booking excludes tax,
// so on its own it disagrees with the "Pay" button.
export interface GuestBookingAmounts {
  total?: number | null;
  taxAmount?: number | null;
  deposit?: number | null;
}

export interface GuestBookingTotals {
  tax: number;
  deposit: number;
  stayWithTax: number;
  dueNow: number;
}

export function guestBookingTotals(b: GuestBookingAmounts): GuestBookingTotals {
  const stay = b.total ?? 0;
  const tax = b.taxAmount ?? 0;
  const deposit = b.deposit ?? 0;
  return { tax, deposit, stayWithTax: stay + tax, dueNow: stay + tax + deposit };
}
