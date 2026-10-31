'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@getrentos/shared';

export const Tabs = RadixTabs.Root;

/**
 * `pill` (the default) is a compact switcher on a tinted track. `underline`
 * is for page-level sections that sit on a card's top edge, where a pill
 * track would read as a second card.
 */
export type TabsVariant = 'pill' | 'underline';

const VariantContext = createContext<TabsVariant>('pill');

interface TabsListProps extends RadixTabs.TabsListProps {
  variant?: TabsVariant;
}

export const TabsList = ({ className, variant = 'pill', ...props }: TabsListProps) => (
  <VariantContext.Provider value={variant}>
    <RadixTabs.List
      className={cn(
        variant === 'pill'
          ? 'inline-flex w-fit gap-1 overflow-x-auto rounded-xl border border-border/70 bg-secondary/80 p-1'
          : 'flex w-full gap-5 overflow-x-auto border-b border-border',
        className
      )}
      {...props}
    />
  </VariantContext.Provider>
);

/**
 * Radix points every trigger's `aria-controls` at its panel. Many screens use
 * tabs purely as a filter strip with no panels, and Radix only mounts the
 * active panel anyway, so that reference is often to an id that is not in the
 * document — an invalid ARIA value. Keep the reference only while its panel
 * exists. Runs after every render because panels mount and unmount with the
 * selection.
 */
function useValidAriaControls() {
  const ref = useRef<HTMLButtonElement>(null);
  const target = useRef<string | null>(null);
  useEffect(() => {
    const trigger = ref.current;
    if (!trigger) return;
    const current = trigger.getAttribute('aria-controls');
    if (current) target.current = current;
    const id = target.current;
    if (!id) return;
    if (document.getElementById(id)) {
      if (current !== id) trigger.setAttribute('aria-controls', id);
    } else if (current) {
      trigger.removeAttribute('aria-controls');
    }
  });
  return ref;
}

export const TabsTrigger = ({ className, ...props }: RadixTabs.TabsTriggerProps) => {
  const variant = useContext(VariantContext);
  const ref = useValidAriaControls();
  return (
    <RadixTabs.Trigger
      ref={ref}
      className={cn(
        variant === 'pill'
          ? cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus:ring-4 focus:ring-primary/12',
              'text-muted-foreground hover:text-foreground',
              'data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm'
            )
          : cn(
              // A bar on the list's bottom border marks the open section.
              '-mb-px border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-sm font-medium whitespace-nowrap transition-colors outline-none',
              'rounded-t-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
              'data-[state=active]:border-primary data-[state=active]:text-foreground'
            ),
        className
      )}
      {...props}
    />
  );
};

export const TabsContent = RadixTabs.Content;
