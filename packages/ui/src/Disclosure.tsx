import type { DetailsHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from '@sureground/icons';
import { cn } from '@sureground/shared';

// Native <details>/<summary>: opens and closes without JavaScript, so it works on server-rendered pages.

export interface DisclosureProps extends Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  'open' | 'title' | 'children'
> {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Disclosures sharing a name form an exclusive group: opening one closes the others. */
  name?: string;
  className?: string;
}

export const Disclosure = ({
  summary,
  children,
  defaultOpen = false,
  name,
  className,
  ...rest
}: DisclosureProps) => (
  <details
    {...rest}
    name={name}
    open={defaultOpen || undefined}
    className={cn('group/disclosure', className)}
  >
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
      <span className="min-w-0">{summary}</span>
      <ChevronDown
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open/disclosure:rotate-180 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </summary>
    <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </details>
);

export interface DisclosureListItem {
  id?: string;
  summary: ReactNode;
  content: ReactNode;
}

interface DisclosureListProps {
  items: readonly DisclosureListItem[];
  /** Makes the list single-open. */
  name?: string;
  /** Index of the item open on first render. */
  defaultOpenIndex?: number;
  className?: string;
}

/** A divided list of disclosures, sized to sit directly inside a Card. */
export const DisclosureList = ({
  items,
  name,
  defaultOpenIndex,
  className,
}: DisclosureListProps) => (
  <div className={cn('divide-y divide-border', className)}>
    {items.map((item, index) => (
      <Disclosure
        key={item.id ?? index}
        summary={item.summary}
        name={name}
        defaultOpen={index === defaultOpenIndex}
      >
        {item.content}
      </Disclosure>
    ))}
  </div>
);
