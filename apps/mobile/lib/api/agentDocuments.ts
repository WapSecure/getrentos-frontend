import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';

export const AGENT_DOCUMENT_CATEGORIES = [
  'INSPECTION_REPORT',
  'VERIFICATION_FORM',
  'ID_SCAN',
  'AGREEMENT',
  'OTHER',
] as const;
export type AgentDocumentCategory = (typeof AGENT_DOCUMENT_CATEGORIES)[number];

export const AGENT_DOCUMENT_CATEGORY_LABEL: Record<AgentDocumentCategory, string> = {
  INSPECTION_REPORT: 'Inspection report',
  VERIFICATION_FORM: 'Verification form',
  ID_SCAN: 'ID scan',
  AGREEMENT: 'Agreement',
  OTHER: 'Other',
};

export interface AgentDocument {
  id: string;
  agentId: string;
  name: string;
  category: AgentDocumentCategory;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  propertyId?: string | null;
  taskId?: string | null;
  createdAt: string;
  property?: { title: string } | null;
  task?: { title: string } | null;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const agentDocumentsApi = {
  list: (page = 1, pageSize = 30, opts?: { category?: AgentDocumentCategory; search?: string }) =>
    apiFetch<Paginated<AgentDocument>>(
      `/agent/documents${toQuery({ page, pageSize, category: opts?.category, search: opts?.search })}`
    ),

  upload: (
    file: PickedFile,
    name: string,
    category: AgentDocumentCategory,
    opts?: { propertyId?: string; taskId?: string }
  ) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    form.append('name', name);
    form.append('category', category);
    if (opts?.propertyId) form.append('propertyId', opts.propertyId);
    if (opts?.taskId) form.append('taskId', opts.taskId);
    return apiUpload<AgentDocument>('/agent/documents', form);
  },

  download: (id: string) =>
    apiFetch<{ name: string; url: string }>(`/agent/documents/${id}/download`),
};
