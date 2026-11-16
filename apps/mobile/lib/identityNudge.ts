export type NudgeRequirement = 'identity' | 'licence';
export type NudgeState = 'missing' | 'pending' | 'rejected';

export function identityNudgeCopy({
  unlocks,
  requirement = 'identity',
  state = 'missing',
}: {
  unlocks: string;
  requirement?: NudgeRequirement;
  state?: NudgeState;
}): { title: string; detail: string; accessibilityLabel: string } {
  const noun = requirement === 'licence' ? 'licence' : 'identity check';
  if (state === 'pending') {
    const title = `Your ${noun} is being reviewed`;
    const detail = `${capitalise(unlocks)} unlock once it is approved. We will let you know.`;
    return { title, detail, accessibilityLabel: `${title}. ${detail}` };
  }
  if (state === 'rejected') {
    const title = `Your ${noun} needs another look`;
    const detail = `Open it to see why, and send it again to unlock ${unlocks}`;
    return { title, detail, accessibilityLabel: `${title}. ${detail}.` };
  }
  if (requirement === 'licence') {
    return {
      title: 'Verify your licence',
      detail: `Unlocks ${unlocks}`,
      accessibilityLabel: `Verify your licence. Unlocks ${unlocks}.`,
    };
  }
  return {
    title: 'Verify your identity',
    detail: `Unlocks ${unlocks}. Takes two minutes`,
    accessibilityLabel: `Verify your identity. Unlocks ${unlocks}.`,
  };
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
