'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X, type LucideIcon } from 'lucide-react';
import { cn } from '@getrentos/shared';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  /** Replaces the variant's icon; pass null for none. */
  icon?: LucideIcon | null;
  /** Buttons or links, placed under the text (or to the right on wide screens). */
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const TONES: Record<AlertVariant, { box: string; icon: string; Icon: LucideIcon }> = {
  info: { box: 'border-info/20 bg-info-subtle', icon: 'text-info', Icon: Info },
  success: { box: 'border-success/20 bg-success-subtle', icon: 'text-success', Icon: CheckCircle2 },
  warning: {
    box: 'border-warning/25 bg-warning-subtle',
    icon: 'text-warning',
    Icon: AlertTriangle,
  },
  danger: {
    box: 'border-destructive/20 bg-destructive-subtle',
    icon: 'text-destructive',
    Icon: OctagonAlert,
  },
  neutral: { box: 'border-border bg-secondary/60', icon: 'text-muted-foreground', Icon: Info },
};

/**
 * An inline message inside a page or form: what happened, or what to know
 * before acting. Danger and warning are announced; the others are read in
 * order. For something that comes and goes after an action, use a toast.
 */
export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  action,
  onDismiss,
  className,
}: AlertProps) {
  const tone = TONES[variant];
  const Icon = icon === undefined ? tone.Icon : icon;
  return (
    <div
      role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border px-4 py-3.5 text-sm', tone.box, className)}
    >
      {Icon && (
        <Icon aria-hidden="true" className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', tone.icon)} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {title && <p className="font-semibold leading-5 text-foreground">{title}</p>}
          {children && <div className="leading-5 text-foreground/80">{children}</div>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1.5 -mt-1 h-8 w-8 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden="true" className="mx-auto h-4 w-4" />
        </button>
      )}
    </div>
  );
}
