/**
 * The kinds of identity document a gate is shown, for the pickers on both
 * clients.
 *
 * ## Why this list exists here, and what is authoritative
 *
 * The backend lives in a SEPARATE repository, so this vocabulary cannot be
 * imported from the Prisma enum that actually defines it — a copy is unavoidable,
 * and the question is only which side wins a disagreement.
 *
 * **The server wins.** `RecordIdCheckDto` validates against the real enum and
 * rejects anything else with a 400, which the live probe asserts by posting
 * `LIBRARY_CARD`. So a stale list here can refuse a document type the estate has
 * legitimately started accepting — annoying, visible, and fixable by shipping the
 * app. It cannot produce a bad record, because the server never stores a value it
 * did not validate.
 *
 * The reverse arrangement would be worse: a client that could name a document
 * type the database has no value for would corrupt an audit trail rather than
 * fail a request.
 *
 * ## Why the labels are not the server's
 *
 * A recorded check is displayed using `documentTypeLabel` from the response, so
 * stored data is always worded by the server and cannot drift. These labels exist
 * only to label the CHOICES before anything is sent — which is why a mismatch is
 * a cosmetic problem on a picker and nothing more.
 */

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

/** The order a form should offer them in. `OTHER` last: an escape hatch, not a choice. */
export const VISITOR_ID_DOCUMENT_ORDER: readonly VisitorIdDocumentType[] = [
  'NIN_SLIP',
  'DRIVERS_LICENCE',
  'VOTERS_CARD',
  'PASSPORT',
  'STAFF_ID',
  'OTHER',
] as const;

/**
 * The sentence both clients show before a capture, because it is the one thing
 * that must not be misread at a barrier.
 */
export const ID_CHECK_NOT_ADMISSION_NOTICE =
  'Recording a document does not admit anybody. The visitor is admitted on their pass, ' +
  'as always — this only keeps a record of who was at the gate, for the estate to look ' +
  'back at if an arrival is ever questioned.';
