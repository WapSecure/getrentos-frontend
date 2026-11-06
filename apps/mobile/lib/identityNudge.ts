import { formatDate } from '@/lib/format';

export type NudgeRequirement = 'identity' | 'licence';

/**
 * The words on the verify-identity (or licence) card. An account in the
 * identity grace period gets the date it must verify by: until then it keeps
 * publishing listings and receiving payouts, after it they stop.
 */
export function identityNudgeCopy({
  unlocks,
  requirement = 'identity',
  graceEndsAt,
}: {
  unlocks: string;
  requirement?: NudgeRequirement;
  graceEndsAt?: string | null;
}): { title: string; detail: string; accessibilityLabel: string } {
  if (requirement === 'licence') {
    return {
      title: 'Verify your licence',
      detail: `Unlocks ${unlocks}`,
      accessibilityLabel: `Verify your licence. Unlocks ${unlocks}.`,
    };
  }
  if (graceEndsAt) {
    const by = formatDate(graceEndsAt, 'short');
    return {
      title: `Verify your identity by ${by}`,
      detail: 'To keep publishing listings and receiving payouts: takes two minutes',
      accessibilityLabel: `Verify your identity by ${by} to keep publishing listings and receiving payouts.`,
    };
  }
  return {
    title: 'Verify your identity',
    detail: `Unlocks ${unlocks}: takes two minutes`,
    accessibilityLabel: `Verify your identity. Unlocks ${unlocks}.`,
  };
}
