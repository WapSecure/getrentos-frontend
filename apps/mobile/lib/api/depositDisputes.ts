import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';

// Disputes on a sale's held deposit (`/marketplace/disputes`), for its buyer or seller. The same
// routes as web's transactionWorkspaceService; decided by Sureground, with no appeal.

/** A party's upload. Kept permanently: never changed or removed. The link lasts 15 minutes. */
export interface DepositDisputeFile {
  id: string;
  name: string;
  mimeType: string | null;
  url: string;
  uploadedBy?: { id: string; legalName: string } | null;
  note?: string | null;
  uploadedAt: string;
}

/** Mirrors `MarketplaceDisputeDto`. */
export interface DepositDispute {
  id: string;
  transactionId: string;
  propertyTitle?: string;
  title: string;
  category: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';
  raisedBy: { id: string; legalName: string };
  against: { id: string; legalName: string };
  description?: string;
  /** Only on the single-dispute read. */
  attachments?: DepositDisputeFile[];
  /** Sureground's decision, once resolved. */
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  /** When Sureground will respond by; null once under review or decided. */
  respondBy?: string | null;
}

export interface DepositDisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export const DEPOSIT_DISPUTE_STATUS: Record<DepositDispute['status'], string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under review',
  ESCALATED: 'Escalated',
  RESOLVED: 'Decided',
};

const one = (id: string) => `/marketplace/disputes/${encodeURIComponent(id)}`;

export const depositDisputesApi = {
  mine: () => apiFetch<Paginated<DepositDispute>>('/marketplace/disputes?pageSize=100'),
  get: (id: string) => apiFetch<DepositDispute>(one(id)),
  messages: (id: string) => apiFetch<DepositDisputeMessage[]>(`${one(id)}/messages`),
  send: (id: string, text: string) =>
    apiFetch<DepositDisputeMessage>(`${one(id)}/messages`, {
      method: 'POST',
      body: { text: text.trim() },
    }),
  /** Either party, while the dispute is open. Returns the dispute with every party's files. */
  addFile: (id: string, file: PickedFile, note?: string) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    if (note?.trim()) form.append('note', note.trim());
    return apiUpload<DepositDispute>(`${one(id)}/evidence`, form);
  },
};
