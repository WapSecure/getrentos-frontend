import {
  BookOpen,
  CalendarCheck,
  Contact,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  Siren,
  TriangleAlert,
  Vote,
  Wrench,
} from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { defineRoleNavigation } from '../resolve';

export const residentNavigation = defineRoleNavigation({
  ariaLabel: 'Resident navigation',
  workspaceLabel: 'Resident',
  dashboardHref: ROUTES.RESIDENT_DASHBOARD,
  items: [
    { id: 'dashboard', label: 'Dashboard', href: ROUTES.RESIDENT_DASHBOARD, icon: LayoutDashboard },
    {
      id: 'announcements',
      label: 'Announcements',
      href: ROUTES.RESIDENT_ANNOUNCEMENTS,
      icon: Megaphone,
    },
    { id: 'dues', label: 'Dues', href: ROUTES.RESIDENT_DUES, icon: ReceiptText },
    {
      id: 'visitorPasses',
      label: 'Visitor passes',
      href: ROUTES.RESIDENT_VISITOR_PASSES,
      icon: KeyRound,
    },
    { id: 'deliveries', label: 'Deliveries', href: ROUTES.RESIDENT_DELIVERIES, icon: Package },
    {
      id: 'violations',
      label: 'Violations',
      href: ROUTES.RESIDENT_VIOLATIONS,
      icon: TriangleAlert,
    },
    { id: 'directory', label: 'Directory', href: ROUTES.RESIDENT_DIRECTORY, icon: Contact },
    { id: 'maintenance', label: 'Maintenance', href: ROUTES.RESIDENT_MAINTENANCE, icon: Wrench },
    { id: 'polls', label: 'Polls', href: ROUTES.RESIDENT_POLLS, icon: Vote },
    { id: 'amenities', label: 'Amenities', href: ROUTES.RESIDENT_AMENITIES, icon: CalendarCheck },
    { id: 'committee', label: 'Committee', href: ROUTES.RESIDENT_COMMITTEE, icon: Landmark },
    { id: 'governance', label: 'Governance', href: ROUTES.RESIDENT_GOVERNANCE, icon: BookOpen },
    { id: 'emergency', label: 'Emergency', href: ROUTES.RESIDENT_EMERGENCY, icon: Siren },
  ],
  groups: [
    { label: 'Overview', items: ['dashboard', 'announcements'] },
    {
      label: 'Access and services',
      items: ['dues', 'visitorPasses', 'deliveries', 'violations', 'directory', 'maintenance'],
    },
    { label: 'Community', items: ['polls', 'amenities', 'committee', 'governance'] },
    { label: 'Emergency', items: ['emergency'] },
  ],
  primary: ['dashboard', 'announcements', 'dues', 'visitorPasses', 'maintenance', 'amenities'],
});
