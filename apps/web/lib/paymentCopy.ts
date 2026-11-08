import type { PaymentProvider } from '@/types/payments';

/**
 * What GetRentos says about a payment, in one place so the pay dialog, the
 * page the payer comes back to and the mobile app (lib/paymentCopy.ts there,
 * kept word for word) say the same thing. Never promise what the system
 * cannot guarantee.
 */

/**
 * Rent. Every rent charge paid in full is held by GetRentos. On the first rent
 * of a new lease it is released when the renter confirms move-in (or the
 * landlord confirms handover); later charges are released on their scheduled
 * date, or earlier if the renter confirms. The pay dialog cannot tell which
 * one a charge is, so the wording covers both.
 */
export const RENT_PROTECTION =
  'GetRentos holds your rent under GetRentos Payment Protection. On a new lease it’s released to your landlord when you confirm move-in; otherwise on the release date shown in your payments.';

/** A part payment does not settle the charge, so nothing is released from it on its own. */
export const RENT_PART_PROTECTION =
  'This counts towards this charge. Your payments show what is still owed and when the rent is released to your landlord.';

export const RENT_NEXT = {
  title: 'Held by GetRentos',
  body: 'This rent is held under GetRentos Payment Protection. If it’s the first rent on a new lease, it’s released to your landlord when you confirm move-in, so report anything wrong with the home before then. Otherwise it’s released on the date shown in your payments.',
};

/** A property sale deposit: released only when the buyer confirms receipt. */
export const SALE_DEPOSIT_PROTECTION =
  'GetRentos holds your deposit and only releases it to the seller once you confirm you have received the property and its documents.';

export const SALE_DEPOSIT_NEXT = {
  title: 'Held by GetRentos',
  body: `${SALE_DEPOSIT_PROTECTION} If the sale does not go ahead, you are refunded under the sale terms.`,
};

/** Land: each conveyance step's share is released only after the buyer confirms that step. */
export const LAND_PROTECTION =
  'GetRentos holds your land payments and pays the seller each conveyance step’s share only after you confirm that step was delivered.';

export const LAND_NEXT = {
  title: 'Held by GetRentos',
  body: `${LAND_PROTECTION} You can follow every step and document from your purchase page.`,
};

/**
 * How a bank transfer works at each company's checkout, for the payer who has
 * never paid that way: a one-time account for the exact amount.
 */
export function transferNote(provider: PaymentProvider | null | undefined, total: string | null) {
  const exact = total ? `exactly ${total}` : 'the exact amount shown';
  const ussd =
    provider === 'PAYSTACK' ? ' With USSD, dial the code shown and approve it on your phone.' : '';
  return `Paying by bank transfer? You get an account number to send ${exact} to. It works for this payment only and expires, so keep the payment page open until it confirms.${ussd}`;
}

/** While a payment is still being confirmed. */
export const TRANSFER_SLOWER = 'Paid by bank transfer? Those can take longer to confirm.';

/**
 * After the payment company says an attempt failed. A failed attempt can still
 * show as a debit that the bank later reverses, so never say nothing was taken.
 */
export const FAILED_BODY =
  'If your bank shows a debit for it, the debit is normally reversed by your bank. You can try again, or choose another way to pay. Keep the reference below if you need help.';
