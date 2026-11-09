import type { MusterRollState, MusterSelfAnswer } from '@/types/estate';

export interface MusterAnswerOption {
  state: MusterSelfAnswer;
  label: string;
  description: string;
  /** Rendered apart: "We need help" must be findable without reading. */
  urgent?: boolean;
}

// No "not yet accounted for" button: that is the state until someone answers. Kept word for
// word with the mobile copy so "safe" never reads as "we need help" on the other platform.
export const MUSTER_ANSWER_OPTIONS: MusterAnswerOption[] = [
  {
    state: 'ACCOUNTED',
    label: 'We are safe',
    description: 'Everybody in this household is out and accounted for.',
  },
  {
    state: 'NOT_ON_SITE',
    label: 'We are not there',
    description: 'Nobody from this household is in the estate right now.',
  },
  {
    state: 'NEEDS_HELP',
    label: 'We need help',
    description: 'Somebody here needs assistance. A marshal is told immediately.',
    urgent: true,
  },
];

export function describeMyHouseholdAnswer(state: MusterRollState): string {
  switch (state) {
    case 'ACCOUNTED':
      return 'You told the estate this household is safe';
    case 'NOT_ON_SITE':
      return 'You told the estate this household is not on site';
    case 'NEEDS_HELP':
      return 'You told the estate this household needs help';
    case 'UNACCOUNTED':
      return 'This household has not answered yet';
  }
}

// Every "has this household answered?" check MUST go through here: visitor lines are answered
// by a marshal, so counting them would nag a household forever for an answer it already gave.
export function residentLines<T extends { basis: 'RESIDENT' | 'ON_SITE' }>(entries: T[]): T[] {
  return entries.filter((entry) => entry.basis === 'RESIDENT');
}

// Unanimous only: mixed answers would hide the line that still needs a marshal, and an all
// UNACCOUNTED household has not spoken.
export function householdHasAnswered(states: MusterRollState[]): boolean {
  if (states.length === 0) return false;
  if (states[0] === 'UNACCOUNTED') return false;
  return states.every((state) => state === states[0]);
}

export function notePlaceholder(state: MusterSelfAnswer): string {
  return state === 'NEEDS_HELP'
    ? 'What is needed, and where you are'
    : 'Anything the estate should know: who is with you, or where you have gone';
}
