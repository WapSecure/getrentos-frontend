import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@getrentos/shared';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  /**
   * The whole card is one target (it holds a stretched link or button): adds
   * the hover lift and a focus ring when the control inside has keyboard focus.
   */
  interactive?: boolean;
  /** Set for a card that is selected or current, e.g. the chosen plan. */
  selected?: boolean;
  delay?: number;
  /** Set for dense dashboard/admin contexts: skips the scroll-in + hover-lift animation meant for marketing pages. */
  static?: boolean;
}

export const Card = ({
  children,
  className = '',
  hover = false,
  interactive = false,
  selected = false,
  delay: _delay = 0,
  static: _isStatic = false,
  ...rest
}: CardProps) => {
  return (
    <div
      {...rest}
      className={cn(
        'overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs',
        selected ? 'border-primary shadow-[inset_0_0_0_1px_var(--primary)]' : 'border-border',
        (hover || interactive) &&
          'transition-[border-color,box-shadow] duration-150 hover:border-foreground/15 hover:shadow-sm',
        interactive && 'relative focus-within:ring-4 focus-within:ring-primary/12',
        className
      )}
    >
      {children}
    </div>
  );
};

interface PartProps {
  children?: ReactNode;
  className?: string;
}

/** Title row of a card: title and description on the left, an action on the right. */
export const CardHeader = ({ children, action, className }: PartProps & { action?: ReactNode }) => (
  <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
    <div className="min-w-0 flex-1 space-y-1">{children}</div>
    {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
  </div>
);

export const CardTitle = ({
  children,
  className,
  as: Tag = 'h3',
}: PartProps & { as?: 'h2' | 'h3' | 'h4' | 'p' }) => (
  <Tag
    className={cn(
      'text-base font-semibold leading-6 tracking-[-0.015em] text-foreground',
      className
    )}
  >
    {children}
  </Tag>
);

export const CardDescription = ({ children, className }: PartProps) => (
  <p className={cn('text-sm leading-5 text-muted-foreground', className)}>{children}</p>
);

export const CardContent = ({ children, className }: PartProps) => (
  <div className={cn('px-5 py-5', className)}>{children}</div>
);

/** Actions at the foot of a card, separated by a hairline; right-aligned, wrapping on phones. */
export const CardFooter = ({ children, className }: PartProps) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-end gap-2 border-t border-border bg-secondary/30 px-5 py-3.5',
      className
    )}
  >
    {children}
  </div>
);
