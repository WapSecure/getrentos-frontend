'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ElementType } from 'react';

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
    <div
      role="tablist"
      aria-label="Section tabs"
      className={`sticky top-[4.75rem] z-20 mb-7 flex gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-background/85 p-1.5 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/75 ${className ?? ''}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
              isActive
                ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
