import { cn } from '@getrentos/shared';

interface ProgressProps {
  /** 0–max. Values outside the range are clamped. */
  value: number;
  max?: number;
  /** Read out with the value, e.g. "Profile complete". */
  label: string;
  /** Shows "3 of 5" or "60%" beside the label. */
  showValue?: boolean | 'percent' | 'fraction';
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

const TONES = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
} as const;

/** A labelled progress bar: verification steps, profile completeness, quota used. */
export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  tone = 'primary',
  size = 'md',
  className,
}: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;
  const shown =
    showValue === 'fraction' ? `${clamped} of ${max}` : showValue ? `${percent}%` : null;
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || shown) && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-foreground">{label}</span>
          {shown && <span className="tabular-nums text-muted-foreground">{shown}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        className={cn('overflow-hidden rounded-full bg-secondary', size === 'sm' ? 'h-1.5' : 'h-2')}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
            TONES[tone]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
