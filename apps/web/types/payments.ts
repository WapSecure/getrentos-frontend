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

/** Answered from Sureground records, never the URL. */
export interface PaymentStatus {
  reference: string;
  kind: PaymentKind;
  status: PaymentState;
  /** Whole naira. */
  amount: number;
  /** Null when there is no one page for it. */
  returnPath: string | null;
  title?: string | null;
  /** ISO. */
  dueDate?: string | null;
  /** ISO. */
  paidAt?: string | null;
  provider?: PaymentProvider;
  channel?: string | null;
  /** Whole naira. */
  fee?: number | null;
  /** Amount plus fee, whole naira. */
  totalCharged?: number | null;
}

/** The payer chooses, so they can switch when one is down. */
export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

/** In the order to offer them. */
export interface PaymentProviderOption {
  provider: PaymentProvider;
  label: string;
  available: boolean;
  /** A fragment that follows the label: "is switched off for now". */
  reason?: string;
}
