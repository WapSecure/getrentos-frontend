'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@getrentos/shared';
import { cn } from '@getrentos/shared';

export type StatCardAccent = 'blue' | 'primary' | 'orange' | 'red' | 'purple' | 'emerald' | 'green';

const accentClasses: Record<StatCardAccent, { bg: string; icon: string; line: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    icon: 'text-blue-600 dark:text-blue-400',
    line: 'from-blue-500',
  },
  primary: {
    bg: 'bg-accent',
    icon: 'text-primary',
    line: 'from-primary',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    icon: 'text-orange-600 dark:text-orange-400',
    line: 'from-orange-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    icon: 'text-red-600 dark:text-red-400',
    line: 'from-red-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    icon: 'text-purple-600 dark:text-purple-400',
    line: 'from-purple-500',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    line: 'from-emerald-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    icon: 'text-green-600 dark:text-green-400',
    line: 'from-green-500',
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
  delay = 0,
  isCurrency = false,
}: StatCardProps) => {
  const formattedValue =
    isCurrency && typeof value === 'number' ? formatCurrency(value, { compact: true }) : value;
  const valueStr = String(formattedValue);
  const valueSize = valueStr.length > 10 ? 'text-lg' : valueStr.length > 8 ? 'text-xl' : 'text-2xl';
  const colors = accentClasses[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.10)]"
    >
      <div className="relative p-4">
        <div
          className={cn(
            'inline-flex p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 mb-3',
            colors.bg
          )}
        >
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={cn('font-semibold tracking-[-0.03em] text-foreground', valueSize)}>
            {formattedValue}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>}
        </div>
      </div>

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          colors.line
        )}
      />
    </motion.div>
  );
};
