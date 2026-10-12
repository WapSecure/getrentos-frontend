import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@getrentos/shared';
import { cn } from '@getrentos/shared';

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
}

export const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  accent = 'blue',
  isCurrency = false,
}: StatCardProps) => {
  const formattedValue =
    isCurrency && typeof value === 'number' ? formatCurrency(value, { compact: true }) : value;
  const valueStr = String(formattedValue);
  const valueSize = valueStr.length > 10 ? 'text-lg' : valueStr.length > 8 ? 'text-xl' : 'text-2xl';
  const colors = accentClasses[accent];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="relative p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className={cn('h-4 w-4', colors.icon)} aria-hidden="true" />
        </div>

        <div>
          <p className={cn('font-semibold tracking-[-0.03em] text-foreground', valueSize)}>
            {formattedValue}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
