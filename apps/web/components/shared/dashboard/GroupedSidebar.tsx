'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Lock } from 'lucide-react';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { PLAN_TIER_LABELS } from '@sureground/shared';
import { SidebarRailToggle, useSidebarRail } from '@sureground/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { resolveRoleNavigation } from '@/lib/navigation/resolve';
import type {
  GroupedSidebarGroup,
  GroupedSidebarItem,
  NavigationGates,
  RoleNavigationConfig,
} from '@/lib/navigation/types';

interface GroupedSidebarProps {
  ariaLabel: string;
  dashboardHref: string;
  groups: GroupedSidebarGroup[];
  workspaceLabel?: string;
}

interface GroupedMobileNavigationProps extends GroupedSidebarProps {
  onNavigate: () => void;
}

export const isSidebarRouteActive = (pathname: string, href: string, dashboardHref: string) =>
  pathname === href || (href !== dashboardHref && pathname.startsWith(`${href}/`));

/** The most specific match, so a nested section doesn't light up its parent too. */
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

const storageKey = (scope: string) => `sureground.sidebar.collapsed-v2:${slug(scope)}`;
const NONE: readonly string[] = [];
const cache = new Map<string, readonly string[]>();
const listeners = new Set<() => void>();

const readCollapsed = (scope: string, defaults: readonly string[]): readonly string[] => {
  const cached = cache.get(scope);
  if (cached) return cached;
  let value: readonly string[] = defaults;
  try {
    const stored = window.localStorage.getItem(storageKey(scope));
    const parsed: unknown = stored === null ? defaults : JSON.parse(stored);
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
    if (e.key?.startsWith('sureground.sidebar.collapsed:')) {
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

function useCollapsedGroups(scope: string, defaults: readonly string[]) {
  const collapsed = useSyncExternalStore(
    subscribe,
    () => readCollapsed(scope, defaults),
    () => NONE
  );
  const setFolded = useCallback(
    (label: string, folded: boolean) => {
      const current = readCollapsed(scope, defaults);
      const next = folded
        ? current.includes(label)
          ? current
          : [...current, label]
        : current.filter((l) => l !== label);
      if (next !== current) writeCollapsed(scope, next);
    },
    [defaults, scope]
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
      <span className="sidebar-item-label min-w-0 flex-1 line-clamp-2 leading-snug break-words">
        {item.label}
      </span>
      {item.locked && (
        <Lock
          className="sidebar-item-extra h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
          aria-label={`${PLAN_TIER_LABELS[item.lockedPlan ?? 'PRO']} plan feature`}
        />
      )}
      {item.badge && <span className="sidebar-item-extra contents">{item.badge}</span>}
    </Link>
  );
}

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
  const defaultCollapsed = groups
    .filter((group) => group.kind !== 'primary' && group.defaultExpanded === false)
    .map((group) => group.label);
  const { collapsed, setFolded } = useCollapsedGroups(scope, defaultCollapsed);

  return (
    <>
      {groups.map((group) => {
        if (group.items.length === 0) return null;
        if (group.kind === 'primary') {
          return (
            <div key={group.label} role="group" aria-label={group.label} className="space-y-1">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={item.href === activeHref}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          );
        }
        if (group.items.length === 1 && group.kind !== 'utility') {
          const [only] = group.items;
          return (
            <div key={group.label}>
              <SidebarLink item={only} active={only.href === activeHref} onNavigate={onNavigate} />
            </div>
          );
        }
        const id = `${idPrefix}-${slug(group.label)}`;
        // Landing in a folded group shows it: a page whose own link is hidden would feel lost.
        const holdsPage = group.items.some((i) => i.href === activeHref);
        const open = holdsPage || !collapsed.includes(group.label);
        return (
          <div
            key={group.label}
            role="group"
            aria-labelledby={`${id}-label`}
            className={group.kind === 'utility' ? 'border-t border-border pt-4' : undefined}
          >
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
          </div>
        );
      })}
    </>
  );
}

function SidebarRail({
  ariaLabel,
  groups,
  activeHref,
  onExpand,
}: {
  ariaLabel: string;
  groups: GroupedSidebarGroup[];
  activeHref?: string;
  onExpand: () => void;
}) {
  const primary = groups.find((group) => group.kind === 'primary')?.items ?? groups[0]?.items ?? [];
  const current = primary.some((item) => item.href === activeHref)
    ? undefined
    : groups.flatMap((group) => group.items).find((item) => item.href === activeHref);
  return (
    <nav className="space-y-1 px-3 py-4" aria-label={ariaLabel}>
      {primary.map((item) => (
        <SidebarLink key={item.href} item={item} active={item.href === activeHref} />
      ))}
      {current && (
        <>
          <div className="sidebar-rail-separator" aria-hidden="true" />
          <SidebarLink item={current} active />
        </>
      )}
      <div className="sidebar-rail-separator" aria-hidden="true" />
      <SidebarRailToggle rail onToggle={() => onExpand()} />
    </nav>
  );
}

/** The first four primary pages, then Messages when the role has it (as the native tab bar does), otherwise the fifth. */
export const phoneBarItems = (primary: GroupedSidebarItem[]): GroupedSidebarItem[] => {
  const messages = primary.find((item) => item.href.endsWith('/messages'));
  const rest = primary.filter((item) => item !== messages);
  return messages ? [...rest.slice(0, 4), messages] : rest.slice(0, 5);
};

function MobilePrimaryNavigation({ ariaLabel, dashboardHref, groups }: GroupedSidebarProps) {
  const pathname = usePathname();
  const primaryItems = phoneBarItems(groups.find((group) => group.kind === 'primary')?.items ?? []);
  const activeHref = activeSidebarHref(pathname, groups, dashboardHref);

  if (primaryItems.length === 0) return null;

  return (
    <nav
      className="mobile-primary-nav fixed inset-x-0 bottom-0 z-50 grid border-t border-border bg-card lg:hidden"
      style={{ gridTemplateColumns: `repeat(${primaryItems.length}, minmax(0, 1fr))` }}
      aria-label={`${ariaLabel} primary`}
    >
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="mobile-primary-nav-item"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function GroupedSidebar({
  ariaLabel,
  dashboardHref,
  groups,
  workspaceLabel,
}: GroupedSidebarProps) {
  const pathname = usePathname();
  const activeHref = activeSidebarHref(pathname, groups, dashboardHref);
  const { rail, setRail } = useSidebarRail();

  return (
    <>
      <aside
        data-rail={rail || undefined}
        className={`workspace-sidebar fixed bottom-0 left-0 top-16 z-30 hidden border-r border-border lg:block ${rail ? '' : 'overflow-y-auto'}`}
      >
        {rail ? (
          <SidebarRail
            ariaLabel={ariaLabel}
            groups={groups}
            activeHref={activeHref}
            onExpand={() => setRail(false)}
          />
        ) : (
          <nav className="space-y-5 px-3 py-4" aria-label={ariaLabel}>
            {workspaceLabel && (
              <div className="px-3 pb-1">
                <p className="text-2xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Workspace
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {workspaceLabel}
                </p>
              </div>
            )}
            <SidebarGroups
              scope={ariaLabel}
              idPrefix="sidebar"
              groups={groups}
              activeHref={activeHref}
            />
            <div className="border-t border-border pt-3">
              <SidebarRailToggle rail={false} onToggle={setRail} />
            </div>
          </nav>
        )}
      </aside>
      <MobilePrimaryNavigation
        ariaLabel={ariaLabel}
        dashboardHref={dashboardHref}
        groups={groups}
      />
    </>
  );
}

export function GroupedMobileNavigation({
  ariaLabel,
  dashboardHref,
  groups,
  onNavigate,
  workspaceLabel,
}: GroupedMobileNavigationProps) {
  const pathname = usePathname();
  const activeHref = activeSidebarHref(pathname, groups, dashboardHref);
  // Closing returns focus to the menu button, so keyboard and screen-reader users aren't dropped at the top of the page.
  const close = useRef(onNavigate);
  useEffect(() => {
    close.current = onNavigate;
  });
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <nav className="space-y-4 p-4" aria-label={`${ariaLabel} mobile`}>
      {workspaceLabel && (
        <div className="border-b border-border px-3 pb-4">
          <p className="text-xs font-medium text-muted-foreground">Current workspace</p>
          <p className="mt-1 font-semibold text-foreground">{workspaceLabel}</p>
        </div>
      )}
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

export function RoleSidebar({
  config,
  gates,
  workspaceLabel = config.workspaceLabel,
}: {
  config: RoleNavigationConfig;
  gates?: NavigationGates;
  workspaceLabel?: string;
}) {
  const { t } = useLanguage();
  return (
    <GroupedSidebar
      ariaLabel={config.ariaLabel}
      workspaceLabel={workspaceLabel}
      dashboardHref={config.dashboardHref}
      groups={resolveRoleNavigation(config, t, gates)}
    />
  );
}

/** The phone drawer: ungated, as it has always been, so locked and flagged pages still appear here. */
export function RoleMobileNavigation({
  config,
  onNavigate,
}: {
  config: RoleNavigationConfig;
  onNavigate: () => void;
}) {
  const { t } = useLanguage();
  return (
    <GroupedMobileNavigation
      ariaLabel={config.ariaLabel}
      workspaceLabel={config.workspaceLabel}
      dashboardHref={config.dashboardHref}
      groups={resolveRoleNavigation(config, t)}
      onNavigate={onNavigate}
    />
  );
}
