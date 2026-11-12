import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';

/** A ruled list with em-dash markers, for plain statements that are not a sequence. */
export const RuledList = ({ items, className }: { items: ReactNode[]; className?: string }) => (
  <ul className={cn('flex flex-col gap-3 border-t border-border pt-5 text-foreground', className)}>
    {items.map((item, index) => (
      <li key={index} className="flex gap-3">
        <span aria-hidden="true" className="text-muted-foreground">
          —
        </span>
        <span className="min-w-0">{item}</span>
      </li>
    ))}
  </ul>
);
