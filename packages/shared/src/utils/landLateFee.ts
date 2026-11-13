// A plan with no late fee used to read "0% late fee", which sounds like a fee. These say "No late fee" instead.

const percent = (bps: number): string => `${Number((bps / 100).toFixed(2))}%`;

const grace = (days: number): string => (days === 1 ? '1 day’s grace' : `${days} days’ grace`);

/** The plan charges a late fee at all. */
export const chargesLateFee = (bps: number | null | undefined): bps is number =>
  typeof bps === 'number' && Number.isFinite(bps) && bps > 0;

/** For a terms table: "5%", or "None". */
export const lateFeeValue = (bps: number | null | undefined): string =>
  chargesLateFee(bps) ? percent(bps) : 'None';

/** Mid-sentence: "5% late fee after 7 days’ grace", or "no late fee". */
export const lateFeeAfterGrace = (bps: number | null | undefined, graceDays: number): string =>
  chargesLateFee(bps) ? `${percent(bps)} late fee after ${grace(graceDays)}` : 'no late fee';

/** A whole sentence: "7 days’ grace on each instalment, then a 5% late fee.", or "No late fee." */
export const lateFeeSentence = (bps: number | null | undefined, graceDays: number): string =>
  chargesLateFee(bps)
    ? `${grace(graceDays)[0].toUpperCase()}${grace(graceDays).slice(1)} on each instalment, then a ${percent(bps)} late fee.`
    : 'No late fee.';
