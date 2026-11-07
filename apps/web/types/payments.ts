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

/** GET /payments/:reference/status — answered from GetRentos records, never the URL. */
export interface PaymentStatus {
  reference: string;
  kind: PaymentKind;
  status: PaymentState;
  /** Whole naira. */
  amount: number;
  /** Where this payment lives in the app, or null when there is no one page for it. */
  returnPath: string | null;
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
