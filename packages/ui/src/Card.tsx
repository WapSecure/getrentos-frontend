import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@sureground/shared';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  /** For a card holding a stretched link or button. */
  interactive?: boolean;
  selected?: boolean;
  delay?: number;
  /** Skips the scroll-in and hover-lift animation, for dense dashboard and admin screens. */
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
