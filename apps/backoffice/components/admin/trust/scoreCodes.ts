/**
 * Reads a `TrustDecision.reasonCodes` array back into the score breakdown that
 * produced the decision.
 *
 * The decision payload deliberately carries the breakdown as flat codes
 * (`SCORE_V2:TOTAL:50`, `SCORE_V2:IDENTITY:21/35`) so the audit trail needs no
 * extra table. A reviewer looking at a decision therefore has the numbers in
 * hand — they just need decoding, which is all this does. It returns null when
 * the decision predates the dimension engine, so callers can render nothing
 * rather than a misleading empty state.
 */
export interface ParsedScoreDimension {
  id: string;
  earned: number;
  weight: number;
}

export interface ParsedScore {
  version?: string;
  total?: number;
  penalty?: number;
  dimensions: ParsedScoreDimension[];
}

const SCORE_PREFIX = 'SCORE_V2:';

/** Dimension ids the payload can carry (kept in sync with score.dimensions.ts). */
const DIMENSION_IDS = ['IDENTITY', 'FINANCIAL', 'ROLE', 'CONTACT', 'ACTIVITY'];

export function parseScoreCodes(reasonCodes: string[] | undefined): ParsedScore | null {
  const codes = (reasonCodes ?? []).filter((code) => code.startsWith(SCORE_PREFIX));
  if (codes.length === 0) return null;

  const parsed: ParsedScore = { dimensions: [] };

  for (const code of codes) {
    const body = code.slice(SCORE_PREFIX.length);
    const [key, value] = splitOnce(body, ':');

    if (key === 'VERSION' && value) {
      parsed.version = value;
      continue;
    }
    if (key === 'TOTAL' && value) {
      const total = Number.parseInt(value, 10);
      if (!Number.isNaN(total)) parsed.total = total;
      continue;
    }
    if (key === 'PENALTY' && value) {
      const penalty = Number.parseInt(value, 10);
      if (!Number.isNaN(penalty)) parsed.penalty = penalty;
      continue;
    }
    if (DIMENSION_IDS.includes(key) && value) {
      const [earned, weight] = value.split('/');
      const earnedNum = Number.parseInt(earned ?? '', 10);
      const weightNum = Number.parseInt(weight ?? '', 10);
      if (!Number.isNaN(earnedNum) && !Number.isNaN(weightNum)) {
        parsed.dimensions.push({ id: key, earned: earnedNum, weight: weightNum });
      }
    }
  }

  return parsed.dimensions.length === 0 && parsed.total === undefined ? null : parsed;
}

/** The codes that are NOT part of the score, i.e. the domain reason codes. */
export function nonScoreCodes(reasonCodes: string[] | undefined): string[] {
  return (reasonCodes ?? []).filter((code) => !code.startsWith(SCORE_PREFIX));
}

/** Human labels for the dimension ids (the payload carries ids, not labels). */
export const DIMENSION_LABELS: Record<string, string> = {
  IDENTITY: 'Identity',
  FINANCIAL: 'Financial',
  ROLE: 'Role & ownership',
  CONTACT: 'Contact & security',
  ACTIVITY: 'Activity',
};

function splitOnce(value: string, separator: string): [string, string | undefined] {
  const index = value.indexOf(separator);
  if (index === -1) return [value, undefined];
  return [value.slice(0, index), value.slice(index + separator.length)];
}
