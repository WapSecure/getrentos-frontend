'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DisclosureCaret, Lock } from '@sureground/icons';
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

/** The workspace's first letter in a small blue tile, as a workspace switcher shows it. */
function WorkspaceMark({ label, size = 'md' }: { label: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/20 ${
        size === 'sm' ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-base'
      }`}
    >
      {label.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function WorkspaceHeader({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-2 shadow-xs">
      <WorkspaceMark label={label} />
      <div className="min-w-0">
        <p className="text-2xs font-medium text-muted-foreground">{caption}</p>
        <p className="truncate text-sm font-semibold leading-tight text-foreground">{label}</p>
      </div>
    </div>
  );
}

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
    if (e.key?.startsWith('sureground.sidebar.collapsed-v2:')) {
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
      <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
      <span className="sidebar-item-label min-w-0 flex-1 truncate" title={item.label}>
        {item.label}
      </span>
      {item.locked && (
        <span
          className="sidebar-item-extra sidebar-lock"
          title={`${PLAN_TIER_LABELS[item.lockedPlan ?? 'PRO']} plan feature`}
        >
          <Lock className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">{`${PLAN_TIER_LABELS[item.lockedPlan ?? 'PRO']} plan feature`}</span>
        </span>
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
            <div key={group.label} role="group" aria-label={group.label} className="space-y-0.5">
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
                <DisclosureCaret
                  className={`h-3.5 w-3.5 shrink-0 ${open ? '' : '-rotate-90'}`}
                  aria-hidden="true"
                />
              </button>
            </h2>
            <div id={`${id}-items`} className="space-y-0.5" hidden={!open}>
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
  workspaceLabel,
}: {
  ariaLabel: string;
  groups: GroupedSidebarGroup[];
  activeHref?: string;
  onExpand: () => void;
  workspaceLabel?: string;
}) {
  const primary = groups.find((group) => group.kind === 'primary')?.items ?? groups[0]?.items ?? [];
  const current = primary.some((item) => item.href === activeHref)
    ? undefined
    : groups.flatMap((group) => group.items).find((item) => item.href === activeHref);
  return (
    <nav className="space-y-0.5 px-3 py-4" aria-label={ariaLabel}>
      {workspaceLabel && (
        <div className="flex justify-center pb-2">
          <WorkspaceMark label={workspaceLabel} size="sm" />
        </div>
      )}
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
            <span className="max-w-full truncate px-0.5">{item.label}</span>
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
            workspaceLabel={workspaceLabel}
          />
        ) : (
          <nav className="space-y-5 px-3 py-4" aria-label={ariaLabel}>
            {workspaceLabel && <WorkspaceHeader label={workspaceLabel} caption="Workspace" />}
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
      {workspaceLabel && <WorkspaceHeader label={workspaceLabel} caption="Current workspace" />}
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

export function RoleMobileNavigation({
  config,
  gates,
  onNavigate,
}: {
  config: RoleNavigationConfig;
  gates?: NavigationGates;
  onNavigate: () => void;
}) {
  const { t } = useLanguage();
  return (
    <GroupedMobileNavigation
      ariaLabel={config.ariaLabel}
      workspaceLabel={config.workspaceLabel}
      dashboardHref={config.dashboardHref}
      groups={resolveRoleNavigation(config, t, gates)}
      onNavigate={onNavigate}
    />
  );
}
