import type { PaymentProvider } from '@/lib/api/paymentStatus';

// Kept word for word with apps/web/lib/paymentCopy.ts. Never promise what the system cannot guarantee.

// The pay dialog can't tell a first rent from a later charge, so the wording covers both.
export const RENT_PROTECTION =
  'Sureground holds your rent under Sureground Payment Protection. On a new lease it’s released to your landlord when you confirm move-in; otherwise on the release date shown in your payments.';

export const RENT_PART_PROTECTION =
  'This counts towards this charge. Your payments show what is still owed and when the rent is released to your landlord.';

export const RENT_NEXT = {
  title: 'Held by Sureground',
  body: 'This rent is held under Sureground Payment Protection. If it’s the first rent on a new lease, it’s released to your landlord when you confirm move-in, so report anything wrong with the home before then. Otherwise it’s released on the date shown in your payments.',
};

export const SALE_DEPOSIT_PROTECTION =
  'Sureground holds your deposit until the handover is done and you confirm.';

export const SALE_DEPOSIT_NEXT = {
  title: 'Held by Sureground',
  body: `${SALE_DEPOSIT_PROTECTION} If the sale does not go ahead, you are refunded under the sale terms.`,
};

export const LAND_PROTECTION =
  'Sureground holds your land payments and pays the seller each conveyance step’s share only after you confirm that step was delivered.';

export const LAND_NEXT = {
  title: 'Held by Sureground',
  body: `${LAND_PROTECTION} You can follow every step and document from your purchase page.`,
};

export function transferNote(provider: PaymentProvider | null | undefined, total: string | null) {
  const exact = total ? `exactly ${total}` : 'the exact amount shown';
  const ussd =
    provider === 'PAYSTACK' ? ' With USSD, dial the code shown and approve it on your phone.' : '';
  return `Paying by bank transfer? You get an account number to send ${exact} to. It works for this payment only and expires, so keep the payment page open until it confirms.${ussd}`;
}

export const TRANSFER_SLOWER = 'Paid by bank transfer? Those can take longer to confirm.';

// A failed attempt can still show as a debit the bank later reverses, so never say nothing was taken.
export const FAILED_BODY =
  'If your bank shows a debit for it, the debit is normally reversed by your bank. You can try again, or choose another way to pay. Keep the reference below if you need help.';
