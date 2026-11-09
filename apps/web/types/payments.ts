/** What a payer's payment is for. */
export type PaymentKind =
  | 'RENT'
  | 'ESCROW'
  | 'SHORTLET'
  | 'LAND'
  | 'FLEX'
  | 'DUE'
  | 'VENDOR_TOP_UP';

/** PENDING means not confirmed yet, never failed. */
export type PaymentState = 'PENDING' | 'PAID' | 'FAILED';

/** GET /payments/:reference/status — answered from Sureground records, never the URL. */
export interface PaymentStatus {
  reference: string;
  kind: PaymentKind;
  status: PaymentState;
  /** Whole naira. */
  amount: number;
  /** Where this payment lives in the app, or null when there is no one page for it. */
  returnPath: string | null;
  /** What it paid for ("Rent for 2-Bed Apartment · Lekki Phase 1"), when known. */
  title?: string | null;
  /** When the charge it paid was due (ISO). */
  dueDate?: string | null;
  /** When it was recorded as paid (ISO). */
  paidAt?: string | null;
  /** Which company took it. */
  provider?: PaymentProvider;
  /** How it was paid: card, bank_transfer, ussd… */
  channel?: string | null;
  /** Card or bank fee the payer covered, whole naira. */
  fee?: number | null;
  /** Amount plus fee, whole naira. */
  totalCharged?: number | null;
}

/** A company that can take a payment. The payer chooses, so they can switch when one is down. */
export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

/** GET /payments/providers — one row per provider, in the order to offer them. */
export interface PaymentProviderOption {
  provider: PaymentProvider;
  /** "Paystack", "Monnify". */
  label: string;
  available: boolean;
  /** Why not, as a fragment that follows the label: "is switched off for now". */
  reason?: string;
}
