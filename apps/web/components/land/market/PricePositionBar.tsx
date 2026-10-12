import { formatCurrency } from '@/lib/format';

/** 1 → "1st", 22 → "22nd", 13 → "13th". */
export const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

/** "cheaper than most", "around the middle" … for a 0-100 percentile. */
export const percentileWords = (percentile: number) =>
  percentile <= 20
    ? 'cheaper per m² than most comparable land'
    : percentile < 40
      ? 'below the middle of comparable land per m²'
      : percentile <= 60
        ? 'around the middle of comparable land per m²'
        : percentile < 80
          ? 'above the middle of comparable land per m²'
          : 'dearer per m² than most comparable land';

/**
 * Where a price per m² sits on a 0-100 strip, with the comparables' median
 * marked. Text carries the same facts, so the bar is decoration for sighted
 * readers rather than the only way to read the position.
 */
export const PricePositionBar = ({
  percentile,
  subjectPricePerSqm,
  medianPricePerSqm,
}: {
  percentile: number;
  subjectPricePerSqm?: number;
  medianPricePerSqm?: number;
}) => {
  const clamped = Math.max(0, Math.min(100, percentile));
  return (
    <div className="space-y-2">
      <div
        className="relative h-3 rounded-full bg-gradient-to-r from-success/30 via-secondary to-warning/40"
        aria-hidden
      >
        <span className="absolute inset-y-0 left-1/2 w-px bg-muted-foreground/60" />
        <span
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground" aria-hidden>
        <span>Cheaper</span>
        <span>Median{medianPricePerSqm ? ` ${formatCurrency(medianPricePerSqm)}/m²` : ''}</span>
        <span>Dearer</span>
      </div>
      <p className="text-sm text-foreground">
        {subjectPricePerSqm ? (
          <>
            At <strong>{formatCurrency(subjectPricePerSqm)}/m²</strong>, this parcel is{' '}
          </>
        ) : (
          'This parcel is '
        )}
        {percentileWords(clamped)} ({ordinal(Math.round(clamped))} percentile).
      </p>
    </div>
  );
};
