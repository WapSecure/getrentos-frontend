import type { ElementType, ReactNode } from 'react';
import type { PlanTier } from '@sureground/shared';
import type { TranslationKey } from '@/lib/i18n/translations';

export type NavPlan = Extract<PlanTier, 'PRO' | 'ENTERPRISE'>;
export type NavFlag = 'landOwners' | 'landMarketplace';

type NavLabel = { labelKey: TranslationKey; label?: never } | { label: string; labelKey?: never };

export type NavItem<Id extends string = string> = NavLabel & {
  id: Id;
  href: string;
  icon: ElementType;
  /** Shown with a lock badge below this plan; the page itself still enforces it. */
  plan?: NavPlan;
  /** Hidden while this feature is switched off. */
  flag?: NavFlag;
};

export interface NavGroupConfig<Id extends string = string> {
  label: string;
  items: readonly Id[];
}

export interface RoleNavigationConfig<Id extends string = string> {
  ariaLabel: string;
  workspaceLabel: string;
  dashboardHref: string;
  items: readonly NavItem<Id>[];
  groups: readonly NavGroupConfig<Id>[];
  /** Pinned above the groups, in the rail and (first five) in the phone bar. */
  primary: readonly Id[];
  /** Moved out of their groups into a closing "Account and preferences" group. */
  utility?: readonly Id[];
}

export interface GroupedSidebarItem {
  label?: ReactNode;
  href: string;
  icon: ElementType;
  locked?: boolean;
  /** Defaults to Pro; pass it for any other plan, or the badge announces the wrong plan to screen readers. */
  lockedPlan?: PlanTier;
  badge?: ReactNode;
}

export interface GroupedSidebarGroup {
  label: string;
  items: GroupedSidebarItem[];
  kind?: 'primary' | 'contextual' | 'utility';
  defaultExpanded?: boolean;
}

export interface NavigationGates {
  isLocked?: (plan: NavPlan) => boolean;
  /** Omitted means nothing is hidden. */
  flags?: Record<NavFlag, boolean>;
}
