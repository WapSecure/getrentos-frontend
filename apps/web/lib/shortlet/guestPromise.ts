import type { GuestPromiseOutcome, GuestPromiseProblem } from '@/types/shortlet';

export const PROBLEM_OPTIONS: { value: GuestPromiseProblem; label: string; hint: string }[] = [
  {
    value: 'NOT_AS_DESCRIBED',
    label: 'Not as described',
    hint: 'It looks different from the photos or listing.',
  },
  {
    value: 'NO_ACCESS',
    label: "Couldn't get in",
    hint: 'Wrong address, locked gate, host not answering.',
  },
  {
    value: 'UNSAFE_OR_UNCLEAN',
    label: 'Unsafe or unclean',
    hint: 'Dirty, broken, or not safe to stay in.',
  },
  {
    value: 'MISSING_ESSENTIALS',
    label: 'Missing what was promised',
    hint: 'No power, water or internet the host said it has.',
  },
];

export const PROBLEM_LABEL = Object.fromEntries(
  PROBLEM_OPTIONS.map((o) => [o.value, o.label])
) as Record<GuestPromiseProblem, string>;

export const OUTCOME_LABEL: Record<GuestPromiseOutcome, string> = {
  FULL_REFUND: 'Upheld: full refund',
  PARTIAL_REFUND: 'Partly upheld: partial refund',
  NOT_UPHELD: 'Not upheld',
};

/** The promise in one sentence, for listings and bookings. */
export const GUEST_PROMISE_TEXT =
  "If the place isn't as described, you can't get in, or it's unsafe, tell us within 24 hours of check-in. We hold the host's payment while we check, and refund you if we uphold it.";

/** "27 September 2026 at 11:00 pm", in Lagos time: the report deadline is to the hour. */
export const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  });
