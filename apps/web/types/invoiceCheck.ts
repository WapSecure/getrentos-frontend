/** GET /home-management/invoices/:invoiceId/check: worked out by Sureground before approving. */
export interface InvoiceCheck {
  invoiceId: string;
  vendor: string;
  total: string;
  checks: { level: 'ok' | 'watch' | 'concern'; text: string }[];
  summary: string;
  /** Questions the reviewer could ask the vendor. */
  questions: string[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
