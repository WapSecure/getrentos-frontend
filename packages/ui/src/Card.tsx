import { ReactNode } from 'react';
import { cn } from '@getrentos/shared';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  /** Set for dense dashboard/admin contexts: skips the scroll-in + hover-lift animation meant for marketing pages. */
  static?: boolean;
}

export const Card = ({
  children,
  className = '',
  hover = false,
  delay: _delay = 0,
  static: _isStatic = false,
}: CardProps) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-xs',
        hover &&
          'transition-[border-color,box-shadow] duration-150 hover:border-foreground/15 hover:shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
};
