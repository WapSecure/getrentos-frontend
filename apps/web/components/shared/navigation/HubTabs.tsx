'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ElementType } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@sureground/ui';

export interface HubTab {
  id: string;
  label: string;
  icon: ElementType;
}

/**
 * Reads the active tab from `?tab=` and returns a setter that writes it back
 * (dropping the param entirely for the default tab, so the canonical URL
 * stays clean). Shared by the renter hub pages that merged several former
 * sidebar entries into one tabbed destination.
 */
export function useHubTab(defaultTab: string, validTabs: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams.get('tab');
  const activeTab = param && validTabs.includes(param) ? param : defaultTab;

  const setTab = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === defaultTab) params.delete('tab');
      else params.set('tab', id);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, defaultTab]
  );

  return [activeTab, setTab] as const;
}

interface HubTabsProps {
  tabs: HubTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function HubTabs({ tabs, activeTab, onChange, className }: HubTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onChange} className={className}>
      <TabsList
        variant="underline"
        aria-label="Section tabs"
        className="sticky top-[4.75rem] z-20 mb-7 bg-background/95 pt-1 backdrop-blur-xl supports-backdrop-filter:bg-background/85"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.id} value={tab.id} className="flex min-h-11 items-center gap-2">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
