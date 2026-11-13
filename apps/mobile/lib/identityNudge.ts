export type NudgeRequirement = 'identity' | 'licence';

export function identityNudgeCopy({
  unlocks,
  requirement = 'identity',
}: {
  unlocks: string;
  requirement?: NudgeRequirement;
}): { title: string; detail: string; accessibilityLabel: string } {
  if (requirement === 'licence') {
    return {
      title: 'Verify your licence',
      detail: `Unlocks ${unlocks}`,
      accessibilityLabel: `Verify your licence. Unlocks ${unlocks}.`,
    };
  }
  // No "verify by <date>": the identity gate on clients and listings refuses an unverified account even in
  // the grace period, so the card says what is blocked now.
  return {
    title: 'Verify your identity',
    detail: `Unlocks ${unlocks}: takes two minutes`,
    accessibilityLabel: `Verify your identity. Unlocks ${unlocks}.`,
  };
}
