import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@sureground/shared';
import { cn } from '@sureground/shared';

export type StatCardAccent = 'blue' | 'primary' | 'orange' | 'red' | 'purple' | 'emerald' | 'green';

const accentClasses: Record<StatCardAccent, { icon: string }> = {
  blue: {
    icon: 'text-muted-foreground',
  },
  primary: {
    icon: 'text-primary',
  },
  orange: {
    icon: 'text-warning',
  },
  red: {
    icon: 'text-destructive',
  },
  purple: {
    icon: 'text-muted-foreground',
  },
  emerald: {
    icon: 'text-success',
  },
  green: {
    icon: 'text-success',
  },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtitle?: string;
  accent?: StatCardAccent;
  delay?: number;
  isCurrency?: boolean;
  /** Quieter portfolio counts beneath the primary financial summary. */
  compact?: boolean;
}

export const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  accent = 'blue',
  isCurrency = false,
  compact = false,
}: StatCardProps) => {
  const formattedValue =
    isCurrency && typeof value === 'number' ? formatCurrency(value, { compact: true }) : value;
  const valueStr = String(formattedValue);
  const valueSize =
    valueStr.length > 10
      ? 'text-xl'
      : valueStr.length > 8
        ? 'text-2xl'
        : compact
          ? 'text-2xl'
          : 'text-3xl';
  const colors = accentClasses[accent];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="relative p-5">
        <div className={cn('flex items-center justify-between gap-3', compact ? 'mb-3' : 'mb-5')}>
          <p className="text-sm font-medium tracking-[-0.01em] text-muted-foreground">{label}</p>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Icon className={cn('h-4 w-4', colors.icon)} aria-hidden="true" />
          </span>
        </div>

        <div>
          <p
            className={cn(
              'data-value break-words font-semibold leading-tight text-foreground',
              valueSize
            )}
          >
            {formattedValue}
          </p>
          {subtitle && <p className="mt-2 text-sm leading-5 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
