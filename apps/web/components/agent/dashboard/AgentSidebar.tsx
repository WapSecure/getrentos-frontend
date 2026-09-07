'use client';

import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  UserCheck,
  RefreshCw,
  FolderOpen,
  MessageCircle,
  Star,
  BadgeCheck,
  Settings,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';

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
  { labelKey: 'sidebar.sync_center', href: ROUTES.AGENT_SYNC, icon: RefreshCw },
  { labelKey: 'sidebar.documents', href: ROUTES.AGENT_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.AGENT_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.reviews', href: ROUTES.AGENT_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.AGENT_TRUST_PROFILE, icon: BadgeCheck },
  { labelKey: 'sidebar.settings', href: ROUTES.AGENT_SETTINGS, icon: Settings },
  { label: 'Verification', href: '/agent/verification', icon: BadgeCheck },
];

export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'Field operations', items: navItems.slice(1, 5) },
  { label: 'Communication', items: navItems.slice(5, 7) },
  { label: 'Trust and account', items: navItems.slice(7) },
];

export const AgentSidebar = () => {
  const { t } = useLanguage();
  return (
    <GroupedSidebar
      ariaLabel="Agent navigation"
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
