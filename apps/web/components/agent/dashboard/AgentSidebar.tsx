'use client';

import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  UserCheck,
  RefreshCw,
  Wrench,
  FolderOpen,
  MessageCircle,
  Star,
  BadgeCheck,
  Settings,
  KeyRound,
  Luggage,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { createRoleNavigation, GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';

interface NavItem {
  labelKey?: TranslationKey;
  label?: string;
  href: string;
  icon: React.ElementType;
}

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.AGENT_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.tasks', href: ROUTES.AGENT_TASKS, icon: ClipboardList },
  { labelKey: 'sidebar.inspections', href: ROUTES.AGENT_INSPECTIONS, icon: ClipboardCheck },
  { labelKey: 'sidebar.verifications', href: ROUTES.AGENT_VERIFICATIONS, icon: UserCheck },
  { label: 'Work orders', href: ROUTES.AGENT_WORK_ORDERS, icon: Wrench },
  { labelKey: 'sidebar.sync_center', href: ROUTES.AGENT_SYNC, icon: RefreshCw },
  { labelKey: 'sidebar.documents', href: ROUTES.AGENT_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.AGENT_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.reviews', href: ROUTES.AGENT_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.AGENT_TRUST_PROFILE, icon: BadgeCheck },
  { label: 'Managed properties', href: ROUTES.AGENT_MANAGED, icon: KeyRound },
  { label: 'My stays', href: ROUTES.AGENT_BOOKINGS, icon: Luggage },
  { labelKey: 'sidebar.settings', href: ROUTES.AGENT_SETTINGS, icon: Settings },
  { label: 'Verification', href: '/agent/verification', icon: BadgeCheck },
];

const baseNavGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'Field operations', items: navItems.slice(1, 6) },
  { label: 'Messages and documents', items: navItems.slice(6, 8) },
  { label: 'Trust and account', items: navItems.slice(8) },
];

export const navGroups = createRoleNavigation(
  baseNavGroups,
  [
    ROUTES.AGENT_DASHBOARD,
    ROUTES.AGENT_TASKS,
    ROUTES.AGENT_INSPECTIONS,
    ROUTES.AGENT_VERIFICATIONS,
    ROUTES.AGENT_WORK_ORDERS,
    ROUTES.AGENT_MESSAGES,
  ],
  [ROUTES.AGENT_SETTINGS, '/agent/verification']
);

export const AgentSidebar = () => {
  const { t } = useLanguage();
  return (
    <GroupedSidebar
      ariaLabel="Agent navigation"
      workspaceLabel="Field operations"
      dashboardHref={ROUTES.AGENT_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          label: item.labelKey ? t(item.labelKey) : item.label,
        })),
      }))}
    />
  );
};
