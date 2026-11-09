import {
  BadgeCheck,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  IdCard,
  KeyRound,
  LayoutDashboard,
  Luggage,
  MessageCircle,
  RefreshCw,
  Settings,
  Star,
  UserCheck,
  Wrench,
} from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { defineRoleNavigation } from '../resolve';

export const agentNavigation = defineRoleNavigation({
  ariaLabel: 'Agent navigation',
  workspaceLabel: 'Field operations',
  dashboardHref: ROUTES.AGENT_DASHBOARD,
  items: [
    {
      id: 'dashboard',
      labelKey: 'sidebar.dashboard',
      href: ROUTES.AGENT_DASHBOARD,
      icon: LayoutDashboard,
    },
    { id: 'tasks', labelKey: 'sidebar.tasks', href: ROUTES.AGENT_TASKS, icon: ClipboardList },
    {
      id: 'inspections',
      labelKey: 'sidebar.inspections',
      href: ROUTES.AGENT_INSPECTIONS,
      icon: ClipboardCheck,
    },
    {
      id: 'verifications',
      labelKey: 'sidebar.verifications',
      href: ROUTES.AGENT_VERIFICATIONS,
      icon: UserCheck,
    },
    { id: 'workOrders', label: 'Work orders', href: ROUTES.AGENT_WORK_ORDERS, icon: Wrench },
    { id: 'sync', labelKey: 'sidebar.sync_center', href: ROUTES.AGENT_SYNC, icon: RefreshCw },
    {
      id: 'documents',
      labelKey: 'sidebar.documents',
      href: ROUTES.AGENT_DOCUMENTS,
      icon: FolderOpen,
    },
    {
      id: 'messages',
      labelKey: 'sidebar.messages',
      href: ROUTES.AGENT_MESSAGES,
      icon: MessageCircle,
    },
    { id: 'reviews', labelKey: 'sidebar.reviews', href: ROUTES.AGENT_REVIEWS, icon: Star },
    {
      id: 'trustProfile',
      labelKey: 'sidebar.trust_profile',
      href: ROUTES.AGENT_TRUST_PROFILE,
      icon: BadgeCheck,
    },
    { id: 'managed', label: 'Managed properties', href: ROUTES.AGENT_MANAGED, icon: KeyRound },
    { id: 'bookings', label: 'My stays', href: ROUTES.AGENT_BOOKINGS, icon: Luggage },
    { id: 'settings', labelKey: 'sidebar.settings', href: ROUTES.AGENT_SETTINGS, icon: Settings },
    { id: 'verification', label: 'Verification', href: '/agent/verification', icon: IdCard },
  ],
  groups: [
    { label: 'Overview', items: ['dashboard'] },
    {
      label: 'Field operations',
      items: ['tasks', 'inspections', 'verifications', 'workOrders', 'sync'],
    },
    { label: 'Messages and documents', items: ['documents', 'messages'] },
    {
      label: 'Trust and account',
      items: ['reviews', 'trustProfile', 'managed', 'bookings', 'settings', 'verification'],
    },
  ],
  primary: ['dashboard', 'tasks', 'inspections', 'verifications', 'workOrders', 'messages'],
  utility: ['settings', 'verification'],
});
