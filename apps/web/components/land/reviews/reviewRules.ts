import type { LandDiligenceCheckStatus } from '@/types/land';
import type { LandReviewCheck, LandReviewDocument } from '@/types/landReviewer';

// Mirrors LandService.recordCheck; the API still decides.

export const hasCitedDocument = (check: LandReviewCheck, documents: LandReviewDocument[]) =>
  documents.some((d) => d.link?.checklistKey === check.key);

export const decisionProblem = (
  check: LandReviewCheck,
  status: LandDiligenceCheckStatus,
  note: string,
  documents: LandReviewDocument[]
): string | null => {
  if (status === 'PASSED' && check.requiresDocument && !hasCitedDocument(check, documents)) {
    return 'This check can only pass once a document is cited against it. Upload the document you relied on, or cite one already on the property, above. Otherwise flag it.';
  }
  const needsNote = status === 'FLAGGED' || (status === 'NOT_APPLICABLE' && check.required);
  if (needsNote && !note.trim()) {
    return status === 'FLAGGED'
      ? 'Say what you found: a note is required to flag a check.'
      : 'Say why: a required check can only be marked not applicable with a note.';
  }
  return null;
};

export const pendingChecks = (checks: LandReviewCheck[]) =>
  checks.filter((c) => c.status === 'PENDING');
