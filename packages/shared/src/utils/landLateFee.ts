// A plan with no late fee says "No late fee": "0% late fee" sounds like a fee.

const percent = (bps: number): string => `${Number((bps / 100).toFixed(2))}%`;

const grace = (days: number): string => (days === 1 ? '1 day’s grace' : `${days} days’ grace`);

export const chargesLateFee = (bps: number | null | undefined): bps is number =>
  typeof bps === 'number' && Number.isFinite(bps) && bps > 0;

export const lateFeeValue = (bps: number | null | undefined): string =>
  chargesLateFee(bps) ? percent(bps) : 'None';

export const lateFeeAfterGrace = (bps: number | null | undefined, graceDays: number): string =>
  chargesLateFee(bps) ? `${percent(bps)} late fee after ${grace(graceDays)}` : 'no late fee';

export const lateFeeSentence = (bps: number | null | undefined, graceDays: number): string =>
  chargesLateFee(bps)
    ? `${grace(graceDays)[0].toUpperCase()}${grace(graceDays).slice(1)} on each instalment, then a ${percent(bps)} late fee.`
    : 'No late fee.';
