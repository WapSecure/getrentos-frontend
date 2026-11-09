import type { TranslationKey } from '@/lib/i18n/translations';
import type {
  GroupedSidebarGroup,
  GroupedSidebarItem,
  NavGroupConfig,
  NavItem,
  NavigationGates,
  RoleNavigationConfig,
} from './types';

/** Typed ids: a group, primary or utility entry naming an unknown item fails to compile. */
export const defineRoleNavigation = <const Id extends string>(config: {
  ariaLabel: string;
  workspaceLabel: string;
  dashboardHref: string;
  items: readonly NavItem<Id>[];
  groups: readonly NavGroupConfig<NoInfer<Id>>[];
  primary: readonly NoInfer<Id>[];
  utility?: readonly NoInfer<Id>[];
}): RoleNavigationConfig<Id> => config;

export function resolveRoleNavigation(
  config: RoleNavigationConfig,
  translate: (key: TranslationKey) => string,
  gates?: NavigationGates
): GroupedSidebarGroup[] {
  const byId = new Map(config.items.map((item) => [item.id, item]));
  const toLink = (item: NavItem): GroupedSidebarItem => {
    const locked = Boolean(item.plan && gates?.isLocked?.(item.plan));
    return {
      label: item.labelKey ? translate(item.labelKey) : item.label,
      href: item.href,
      icon: item.icon,
      locked,
      lockedPlan: item.plan,
    };
  };
  const visible = (item: NavItem) => !item.flag || !gates?.flags || gates.flags[item.flag];
  const links = (ids: readonly string[]) =>
    ids.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });

  const promoted = new Set([...config.primary, ...(config.utility ?? [])]);
  // Groups are dropped before gating, not after: a group a flag empties keeps its place in folded-group storage.
  const contextual = config.groups
    .map((group) => ({
      label: group.label,
      items: links(group.items.filter((id) => !promoted.has(id))),
    }))
    .filter((group) => group.items.length > 0);
  const utilities = links(config.utility ?? []);

  const groups: {
    label: string;
    kind: GroupedSidebarGroup['kind'];
    defaultExpanded?: boolean;
    items: NavItem[];
  }[] = [
    { label: 'Primary', kind: 'primary', items: links(config.primary) },
    ...contextual.map((group) => ({
      ...group,
      kind: 'contextual' as const,
      defaultExpanded: false,
    })),
    ...(utilities.length
      ? [
          {
            label: 'Account and preferences',
            kind: 'utility' as const,
            defaultExpanded: false,
            items: utilities,
          },
        ]
      : []),
  ];
  return groups.map((group) => ({ ...group, items: group.items.filter(visible).map(toLink) }));
}
