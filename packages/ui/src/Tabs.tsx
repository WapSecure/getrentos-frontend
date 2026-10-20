'use client';

import { createContext, useContext } from 'react';
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

export const TabsTrigger = ({ className, ...props }: RadixTabs.TabsTriggerProps) => {
  const variant = useContext(VariantContext);
  return (
    <RadixTabs.Trigger
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
