import type { ElementType, ReactNode } from 'react';
import { cn } from '@sureground/shared';

interface EyebrowProps {
  children: ReactNode;
  /** `light` is for a `bg-primary` band: full-strength foreground, never faded. */
  tone?: 'brand' | 'light';
  /** Centred intros drop the leading rule so the label sits square. */
  rule?: boolean;
  as?: ElementType;
  className?: string;
}

/** The tracked-capitals label above a heading, in Sureground blue with a short leading rule. */
export const Eyebrow = ({
  children,
  tone = 'brand',
  rule = true,
  as: Tag = 'p',
  className,
}: EyebrowProps) => (
  <Tag
    className={cn(
      'label-caps flex items-center gap-3',
      tone === 'brand' ? 'text-primary' : 'text-primary-foreground',
      className
    )}
  >
    {rule ? (
      <span
        aria-hidden="true"
        className={cn(
          'h-px w-8 shrink-0',
          tone === 'brand' ? 'bg-primary' : 'bg-primary-foreground'
        )}
      />
    ) : null}
    <span className="min-w-0">{children}</span>
  </Tag>
);
