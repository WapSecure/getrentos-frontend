import { cn } from '@sureground/shared';

export interface SegmentedBarSegment {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

// Written out in full: Tailwind only generates classes it finds as literals.
const TONE: Record<SegmentedBarSegment['tone'], string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  neutral: 'bg-muted-foreground/30',
};

interface SegmentedBarProps {
  segments: SegmentedBarSegment[];
  /** What the whole bar measures, for screen readers ("Units by status"). */
  label: string;
  className?: string;
}

/** Parts of a whole (occupied, reserved, vacant) as one bar with a legend. */
export function SegmentedBar({ segments, label, className }: SegmentedBarProps) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const summary = segments.map((s) => `${s.label} ${s.value}`).join(', ');
  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="img"
        aria-label={`${label}: ${summary}`}
        className="flex h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        {total > 0 &&
          segments.map((s) =>
            s.value > 0 ? (
              <span
                key={s.label}
                className={cn('h-full first:rounded-l-full last:rounded-r-full', TONE[s.tone])}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            ) : null
          )}
      </div>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-muted-foreground">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', TONE[s.tone])} />
            {s.label}
            <span className="font-medium tabular-nums text-foreground">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
