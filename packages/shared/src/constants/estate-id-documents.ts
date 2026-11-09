// Copy of the backend's Prisma enum (separate repo); the server validates and wins. Recorded checks
// show the server's `documentTypeLabel`, so these labels only word the picker.
export type VisitorIdDocumentType =
  | 'NIN_SLIP'
  | 'DRIVERS_LICENCE'
  | 'VOTERS_CARD'
  | 'PASSPORT'
  | 'STAFF_ID'
  | 'OTHER';

export const VISITOR_ID_DOCUMENT_LABELS: Record<VisitorIdDocumentType, string> = {
  NIN_SLIP: 'National identity number slip',
  DRIVERS_LICENCE: "Driver's licence",
  VOTERS_CARD: "Voter's card",
  PASSPORT: 'Passport',
  STAFF_ID: 'Staff identity card',
  OTHER: 'Another document',
};

// `OTHER` last: an escape hatch, not a choice.
export const VISITOR_ID_DOCUMENT_ORDER: readonly VisitorIdDocumentType[] = [
  'NIN_SLIP',
  'DRIVERS_LICENCE',
  'VOTERS_CARD',
  'PASSPORT',
  'STAFF_ID',
  'OTHER',
] as const;

export const ID_CHECK_NOT_ADMISSION_NOTICE =
  'Recording a document does not admit anybody. The visitor is admitted on their pass, ' +
  'as always — this only keeps a record of who was at the gate, for the estate to look ' +
  'back at if an arrival is ever questioned.';
