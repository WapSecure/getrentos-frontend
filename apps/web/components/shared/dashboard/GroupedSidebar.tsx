'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

export interface GroupedSidebarItem {
  label: ReactNode;
  href: string;
  icon: ElementType;
  /** Shows a small lock badge — the page itself still opens, and prompts to upgrade. */
  locked?: boolean;
}

export interface GroupedSidebarGroup {
  label: string;
  items: GroupedSidebarItem[];
}

interface GroupedSidebarProps {
  ariaLabel: string;
  dashboardHref: string;
  groups: GroupedSidebarGroup[];
}

interface GroupedMobileNavigationProps extends GroupedSidebarProps {
  onNavigate: () => void;
}

export const isSidebarRouteActive = (pathname: string, href: string, dashboardHref: string) =>
  pathname === href || (href !== dashboardHref && pathname.startsWith(`${href}/`));

export function GroupedSidebar({ ariaLabel, dashboardHref, groups }: GroupedSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 overflow-y-auto border-r border-border/70 bg-card/55 backdrop-blur-xl supports-backdrop-filter:bg-card/65 lg:block">
      <nav className="space-y-5 p-4" aria-label={ariaLabel}>
        {groups.map((group) => (
          <section
            key={group.label}
            aria-labelledby={`sidebar-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          >
            <h2
              id={`sidebar-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75"
            >
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = isSidebarRouteActive(pathname, item.href, dashboardHref);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.locked && (
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                        aria-label="Pro plan feature"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}

export function GroupedMobileNavigation({
  ariaLabel,
  dashboardHref,
  groups,
  onNavigate,
}: GroupedMobileNavigationProps) {
  const pathname = usePathname();
  return (
    <nav className="space-y-5 p-4" aria-label={`${ariaLabel} mobile`}>
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75">
            {group.label}
          </h2>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = isSidebarRouteActive(pathname, item.href, dashboardHref);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-secondary'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.locked && (
                    <Lock
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                      aria-label="Pro plan feature"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
