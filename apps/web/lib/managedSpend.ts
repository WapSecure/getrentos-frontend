import type { BadgeVariant, TimelineState } from '@sureground/ui';
import type {
  AwaitingOwnerApproval,
  EvidenceStageStatus,
  SpendBand,
  SpendBands,
} from '@/types/managed';

export const SPEND_BAND_LABELS: Record<SpendBand, string> = {
  ROUTINE: 'Routine',
  OWNER: 'Owner approval',
  EXPLICIT: 'Explicit authorisation',
  EMERGENCY: 'Emergency',
};

export const SPEND_BAND_VARIANT: Record<SpendBand, BadgeVariant> = {
  ROUTINE: 'neutral',
  OWNER: 'info',
  EXPLICIT: 'warning',
  EMERGENCY: 'danger',
};

/** Approving an EXPLICIT request asks the owner to confirm who they are first. */
export const needsExplicitAuthorisation = (band: SpendBand | null | undefined) =>
  band === 'EXPLICIT';

/**
 * Evidence stages in their fixed order. Done, flagged and not-applicable stages say so; of the
 * stages still waiting, only the earliest is current.
 */
export function evidenceStates(statuses: readonly EvidenceStageStatus[]): TimelineState[] {
  const current = statuses.indexOf('PENDING');
  return statuses.map((status, index) => {
    if (status === 'DONE') return 'done';
    if (status === 'FLAGGED') return 'blocked';
    if (status === 'NOT_APPLICABLE') return 'skipped';
    return index === current ? 'current' : 'pending';
  });
}

/** Spend the API parked for the owner instead of refusing. */
export function isAwaitingOwnerApproval(value: unknown): value is AwaitingOwnerApproval {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { state?: unknown }).state === 'AWAITING_OWNER_APPROVAL'
  );
}

/** What the manager is told when their spend went to the owner: nothing is approved until they retry. */
export const AWAITING_OWNER_MESSAGE: Record<SpendBand, string> = {
  ROUTINE: 'Sent to the owner to approve. Approve it again here once they have.',
  OWNER:
    'This is above the routine limit, so it has gone to the owner. Approve it again here once they have.',
  EXPLICIT:
    'This is above the explicit amount, so the owner must authorise it. Approve it again here once they have.',
  EMERGENCY: 'Sent to the owner as emergency spend. Approve it again here once they have.',
};

/** The invoice looks like one already approved or paid: the caller must acknowledge it with a reason. */
export function isDuplicateInvoiceRefusal(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const { code, details } = err as { code?: unknown; details?: unknown };
  if (typeof code === 'string' && /DUPLICATE/i.test(code)) return true;
  const detailCode = (details as { code?: unknown } | null)?.code;
  return typeof detailCode === 'string' && /DUPLICATE/i.test(detailCode);
}

/**
 * Bands from the three inputs (0 means no limit). As the API requires, neither the emergency
 * limit nor the explicit threshold may sit below the routine limit.
 */
export function bandsFromInputs(input: { routine: number; emergency: number; explicit: number }): {
  bands: SpendBands;
  error: { field: 'emergency' | 'explicit'; message: string } | null;
} {
  const value = (n: number) => (Number.isFinite(n) && n > 0 ? Math.round(n) : null);
  const bands: SpendBands = {
    routineCap: value(input.routine),
    emergencyCap: value(input.emergency),
    explicitAbove: value(input.explicit),
  };
  const { routineCap, emergencyCap, explicitAbove } = bands;
  if (routineCap !== null && emergencyCap !== null && emergencyCap < routineCap) {
    return {
      bands,
      error: {
        field: 'emergency',
        message: 'The emergency limit cannot be below the routine limit.',
      },
    };
  }
  if (routineCap !== null && explicitAbove !== null && explicitAbove < routineCap) {
    return {
      bands,
      error: { field: 'explicit', message: 'This cannot be below the routine limit.' },
    };
  }
  return { bands, error: null };
}
