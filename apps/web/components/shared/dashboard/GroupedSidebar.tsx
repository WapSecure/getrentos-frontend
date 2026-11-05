'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Lock } from 'lucide-react';
import { useCallback, useSyncExternalStore, type ElementType, type ReactNode } from 'react';
import { PLAN_TIER_LABELS, type PlanTier } from '@getrentos/shared';

export interface GroupedSidebarItem {
  label: ReactNode;
  href: string;
  icon: ElementType;
  /** Shows a small lock badge: the page itself still opens, and prompts to upgrade. */
  locked?: boolean;
  /**
   * Which plan clears the lock, so the badge can say so out loud.
   *
   * Defaults to Pro, which is what every gated item was until Enterprise
   * existed. Pass this whenever the gate is not Pro, or the badge announces the
   * wrong plan to a screen reader.
   */
  lockedPlan?: PlanTier;
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

/**
 * The one sidebar link for this page: the most specific match, so a section
 * nested under another (/buyer/land/purchases under /buyer/land) doesn't light
 * up both.
 */
export const activeSidebarHref = (
  pathname: string,
  groups: GroupedSidebarGroup[],
  dashboardHref: string
): string | undefined =>
  groups
    .flatMap((group) => group.items.map((item) => item.href))
    .filter((href) => isSidebarRouteActive(pathname, href, dashboardHref))
    .sort((a, b) => b.length - a.length)[0];

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * Which groups this person has folded away, remembered per workspace in the
 * browser. Everything starts open, so nothing is hidden until they choose to
 * hide it; the group holding the current page always shows.
 */
const storageKey = (scope: string) => `getrentos.sidebar.collapsed:${slug(scope)}`;
const NONE: readonly string[] = [];
const cache = new Map<string, readonly string[]>();
const listeners = new Set<() => void>();

const readCollapsed = (scope: string): readonly string[] => {
  const cached = cache.get(scope);
  if (cached) return cached;
  let value: readonly string[] = NONE;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey(scope)) ?? '[]');
    if (Array.isArray(parsed)) value = parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    // Unreadable or absent: start open.
  }
  cache.set(scope, value);
  return value;
};

const writeCollapsed = (scope: string, labels: readonly string[]) => {
  cache.set(scope, labels);
  try {
    window.localStorage.setItem(storageKey(scope), JSON.stringify(labels));
  } catch {
    // Private mode or a full store: the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
};

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  // Folded in another tab: forget what we cached so the next read sees it.
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('getrentos.sidebar.collapsed:')) {
      cache.clear();
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
};

function useCollapsedGroups(scope: string) {
  const collapsed = useSyncExternalStore(
    subscribe,
    () => readCollapsed(scope),
    () => NONE
  );
  const setFolded = useCallback(
    (label: string, folded: boolean) => {
      const current = readCollapsed(scope);
      const next = folded
        ? current.includes(label)
          ? current
          : [...current, label]
        : current.filter((l) => l !== label);
      if (next !== current) writeCollapsed(scope, next);
    },
    [scope]
  );
  return { collapsed, setFolded };
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: GroupedSidebarItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className="sidebar-item"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.locked && (
        <Lock
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
          aria-label={`${PLAN_TIER_LABELS[item.lockedPlan ?? 'PRO']} plan feature`}
        />
      )}
    </Link>
  );
}

/**
 * The groups of links, each foldable from its heading. A group of one item
 * (Overview → Dashboard) is just the item: a heading and a fold for one link
 * is more furniture than wayfinding.
 */
function SidebarGroups({
  scope,
  idPrefix,
  groups,
  activeHref,
  onNavigate,
}: {
  scope: string;
  idPrefix: string;
  groups: GroupedSidebarGroup[];
  activeHref?: string;
  onNavigate?: () => void;
}) {
  const { collapsed, setFolded } = useCollapsedGroups(scope);

  return (
    <>
      {groups.map((group) => {
        if (group.items.length === 1) {
          const [only] = group.items;
          return (
            <div key={group.label}>
              <SidebarLink item={only} active={only.href === activeHref} onNavigate={onNavigate} />
            </div>
          );
        }
        const id = `${idPrefix}-${slug(group.label)}`;
        // Landing in a folded group (search, a notification, a typed URL)
        // shows it: a page whose own link is hidden would feel lost.
        const holdsPage = group.items.some((i) => i.href === activeHref);
        const open = holdsPage || !collapsed.includes(group.label);
        return (
          <section key={group.label} aria-labelledby={`${id}-label`}>
            <h2 className="sidebar-label">
              <button
                type="button"
                id={`${id}-label`}
                className="sidebar-group-toggle"
                aria-expanded={open}
                aria-controls={`${id}-items`}
                onClick={() => setFolded(group.label, open)}
              >
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
                  aria-hidden="true"
                />
              </button>
            </h2>
            <div id={`${id}-items`} className="space-y-1" hidden={!open}>
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={item.href === activeHref}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function GroupedSidebar({ ariaLabel, dashboardHref, groups }: GroupedSidebarProps) {
  const pathname = usePathname();
  const activeHref = activeSidebarHref(pathname, groups, dashboardHref);

  return (
    <aside className="workspace-sidebar fixed bottom-0 left-0 top-16 z-30 hidden w-64 overflow-y-auto border-r border-border lg:block">
      <nav className="space-y-5 px-3 py-5" aria-label={ariaLabel}>
        <SidebarGroups
          scope={ariaLabel}
          idPrefix="sidebar"
          groups={groups}
          activeHref={activeHref}
        />
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
  const activeHref = activeSidebarHref(pathname, groups, dashboardHref);
  return (
    <nav className="space-y-4 p-4" aria-label={`${ariaLabel} mobile`}>
      <SidebarGroups
        scope={ariaLabel}
        idPrefix="mobile-nav"
        groups={groups}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
