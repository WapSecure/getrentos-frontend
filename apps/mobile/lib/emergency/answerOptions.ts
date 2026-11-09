import type { MusterRollState, MusterSelfAnswer } from '../api/resident';

export interface MusterAnswerOption {
  state: MusterSelfAnswer;
  label: string;
  description: string;
  urgent?: boolean;
}

// No "not yet accounted for" button on purpose: that is the state until somebody answers.
// Keep identical to apps/web/lib/emergency/answerOptions.ts.
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

// Anything asking "has this household answered?" must go through here: counting visitor lines would leave it unanswered forever.
export function residentLines<T extends { basis: 'RESIDENT' | 'ON_SITE' }>(entries: T[]): T[] {
  return entries.filter((entry) => entry.basis === 'RESIDENT');
}

// `UNACCOUNTED` is unanimous too, but it is not an answer.
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
