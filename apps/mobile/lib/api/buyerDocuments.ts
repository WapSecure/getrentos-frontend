import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './buyer';

export const BUYER_DOCUMENT_TYPES = [
  'PROOF_OF_FUNDS',
  'MORTGAGE_PREAPPROVAL',
  'IDENTITY',
  'TRANSFER_AGREEMENT',
  'TITLE_DEED',
  'PAYMENT_RECEIPT',
  'OTHER',
] as const;
export type BuyerDocumentType = (typeof BUYER_DOCUMENT_TYPES)[number];

export const BUYER_DOCUMENT_TYPE_LABEL: Record<BuyerDocumentType, string> = {
  PROOF_OF_FUNDS: 'Proof of funds',
  MORTGAGE_PREAPPROVAL: 'Mortgage preapproval',
  IDENTITY: 'Identity',
  TRANSFER_AGREEMENT: 'Transfer agreement',
  TITLE_DEED: 'Title deed',
  PAYMENT_RECEIPT: 'Payment receipt',
  OTHER: 'Other',
};

/** The document's `type` (write-side, uppercase) rendered lowercase-with-underscores for display. */
export type BuyerDocumentCategory =
  | 'proof_of_funds'
  | 'mortgage_preapproval'
  | 'identity'
  | 'transfer_agreement'
  | 'title_deed'
  | 'payment_receipt'
  | 'other';

export const BUYER_DOCUMENT_CATEGORY_LABEL: Record<BuyerDocumentCategory, string> = {
  proof_of_funds: 'Proof of funds',
  mortgage_preapproval: 'Mortgage preapproval',
  identity: 'Identity',
  transfer_agreement: 'Transfer agreement',
  title_deed: 'Title deed',
  payment_receipt: 'Payment receipt',
  other: 'Other',
};

export interface BuyerDocument {
  id: string;
  name: string;
  category: BuyerDocumentCategory;
  propertyTitle?: string;
  uploadedAt: string;
  sizeLabel: string;
  downloadUrl?: string;
}

export const buyerDocumentsApi = {
  list: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<BuyerDocument>>(`/buyer/documents?page=${page}&pageSize=${pageSize}`),

  upload: (
    file: PickedFile,
    name: string,
    type: BuyerDocumentType,
    opts?: { offerId?: string; transactionId?: string }
  ) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    form.append('name', name);
    form.append('type', type);
    if (opts?.offerId) form.append('offerId', opts.offerId);
    if (opts?.transactionId) form.append('transactionId', opts.transactionId);
    return apiUpload<BuyerDocument>('/buyer/documents', form);
  },

  remove: (id: string) => apiFetch<void>(`/buyer/documents/${id}`, { method: 'DELETE' }),
};
