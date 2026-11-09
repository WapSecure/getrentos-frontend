export interface InvoiceCheck {
  invoiceId: string;
  vendor: string;
  total: string;
  checks: { level: 'ok' | 'watch' | 'concern'; text: string }[];
  summary: string;
  questions: string[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
