import type { MusterRollState, MusterSelfAnswer } from '@/types/estate';

export interface MusterAnswerOption {
  state: MusterSelfAnswer;
  /** The button. First person, because the person pressing it is the subject. */
  label: string;
  /** What the answer tells the estate, so nobody presses the wrong one in a hurry. */
  description: string;
  /**
   * Rendered apart from the other two.
   *
   * "We need help" is the one answer that has to be findable without reading:
   * somebody looking for it is not in a position to compare three similar rows.
   */
  urgent?: boolean;
}

/**
 * The three things a household can say, and exactly what each one means.
 *
 * There is no "not yet accounted for" button, and that is the point: it is the
 * state a household is in *until* somebody answers, so offering it would let a
 * roll call sit unanswered with a tick next to it. The estate discovers people
 * by asking and not being answered — never by being told nothing.
 *
 * The wording lives in one file per platform rather than inline in each screen,
 * so the phone and the desktop cannot drift into two different meanings for the
 * same button — which on this screen would mean a household saying "safe" when
 * the estate read "we need help".
 */
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

/** The answers a household has already given, as one line for the banner. */
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

/**
 * The lines a household's own answer covers: the people who live there.
 *
 * A household's view of the roll also carries the visitors the estate admitted to
 * it, still on site. Those are on the roll for good reason — the estate has to
 * find them — but a marshal answers for them, because the person who let a
 * visitor in is not necessarily the person holding the phone.
 *
 * Anything that asks "has this household answered?" MUST go through here. Counting
 * visitor lines means a household who has answered is told forever that they have
 * not: their own lines read ACCOUNTED while the visitor lines stay UNACCOUNTED,
 * so the answer is never unanimous and the household is nagged for an answer it
 * already gave.
 */
export function residentLines<T extends { basis: 'RESIDENT' | 'ON_SITE' }>(entries: T[]): T[] {
  return entries.filter((entry) => entry.basis === 'RESIDENT');
}

/**
 * True when every line this household owns carries the same answer, and that
 * answer is an answer.
 *
 * A household of three who have answered three different things is a real state
 * — one flat empty, one in the building with a visitor — and reporting it as
 * "answered" would hide the line that still needs a marshal. So the banner only
 * claims the household has answered when the answer is unanimous, and says so
 * per line otherwise.
 *
 * `UNACCOUNTED` is unanimous too, when nobody has replied, and it is not an
 * answer: a household that has said nothing must never be described as having
 * spoken.
 */
export function householdHasAnswered(states: MusterRollState[]): boolean {
  if (states.length === 0) return false;
  if (states[0] === 'UNACCOUNTED') return false;
  return states.every((state) => state === states[0]);
}

/** Where to add something the estate should know. Optional on every answer. */
export function notePlaceholder(state: MusterSelfAnswer): string {
  return state === 'NEEDS_HELP'
    ? 'What is needed, and where you are'
    : 'Anything the estate should know — who is with you, or where you have gone';
}
