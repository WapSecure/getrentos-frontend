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
