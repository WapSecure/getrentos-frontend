import {
  BedDouble,
  CalendarClock,
  FolderOpen,
  Globe,
  Handshake,
  Heart,
  Landmark,
  LayoutDashboard,
  MapPinned,
  MessageCircle,
  MessageCircleQuestion,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Video,
} from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { VISIT_ROUTES } from '@/lib/constants/visitRoutes';
import { defineRoleNavigation } from '../resolve';

export const buyerNavigation = defineRoleNavigation({
  ariaLabel: 'Buyer navigation',
  workspaceLabel: 'Buyer',
  dashboardHref: ROUTES.BUYER_DASHBOARD,
  items: [
    {
      id: 'dashboard',
      labelKey: 'sidebar.dashboard',
      href: ROUTES.BUYER_DASHBOARD,
      icon: LayoutDashboard,
    },
    { id: 'discover', labelKey: 'sidebar.discover', href: ROUTES.BUYER_DISCOVER, icon: Search },
    {
      id: 'land',
      labelKey: 'sidebar.land_marketplace',
      href: ROUTES.BUYER_LAND,
      icon: MapPinned,
      flag: 'landMarketplace',
    },
    {
      id: 'bookings',
      labelKey: 'sidebar.shortlet_bookings',
      href: ROUTES.BUYER_BOOKINGS,
      icon: BedDouble,
    },
    { id: 'saved', labelKey: 'sidebar.saved_properties', href: ROUTES.BUYER_SAVED, icon: Heart },
    {
      id: 'viewings',
      labelKey: 'sidebar.viewing_requests',
      href: ROUTES.BUYER_VIEWINGS,
      icon: CalendarClock,
    },
    { id: 'tours', label: 'Video tours', href: VISIT_ROUTES.BUYER_TOURS, icon: Video },
    {
      id: 'inspections',
      label: 'Inspections',
      href: VISIT_ROUTES.BUYER_INSPECTIONS,
      icon: ScanSearch,
    },
    { id: 'offers', labelKey: 'sidebar.offers', href: ROUTES.BUYER_OFFERS, icon: Handshake },
    {
      id: 'developerQuestions',
      label: 'Questions to developers',
      href: ROUTES.BUYER_DEVELOPER_QUESTIONS,
      icon: MessageCircleQuestion,
    },
    {
      id: 'transactions',
      labelKey: 'sidebar.transactions',
      href: ROUTES.BUYER_TRANSACTIONS,
      icon: ShieldCheck,
    },
    {
      id: 'landPurchases',
      labelKey: 'sidebar.land_purchases',
      href: LAND_BUYER_ROUTES.HUB,
      icon: Landmark,
      flag: 'landMarketplace',
    },
    {
      id: 'invest',
      labelKey: 'sidebar.diaspora_invest',
      href: DIASPORA_ROUTES.BUYER_WORKSPACE,
      icon: Globe,
      flag: 'diasporaInvest',
    },
    {
      id: 'documents',
      labelKey: 'sidebar.documents',
      href: ROUTES.BUYER_DOCUMENTS,
      icon: FolderOpen,
    },
    {
      id: 'messages',
      labelKey: 'sidebar.messages',
      href: ROUTES.BUYER_MESSAGES,
      icon: MessageCircle,
    },
    { id: 'reviews', labelKey: 'sidebar.reviews', href: ROUTES.BUYER_REVIEWS, icon: Star },
    {
      id: 'trust',
      label: 'Trust & verification',
      href: ROUTES.BUYER_TRUST_PROFILE,
      icon: ShieldCheck,
    },
    { id: 'settings', labelKey: 'sidebar.settings', href: ROUTES.BUYER_SETTINGS, icon: Settings },
  ],
  groups: [
    { label: 'Overview', items: ['dashboard'] },
    { label: 'Find property', items: ['discover', 'saved', 'land'] },
    {
      label: 'Buying',
      items: [
        'viewings',
        'tours',
        'inspections',
        'offers',
        'developerQuestions',
        'transactions',
        'landPurchases',
        'invest',
      ],
    },
    { label: 'Messages and documents', items: ['messages', 'documents'] },
    {
      label: 'Trust and account',
      items: ['trust', 'reviews', 'settings', 'bookings'],
    },
  ],
  primary: ['dashboard', 'discover', 'saved', 'offers', 'transactions', 'messages'],
  utility: ['settings', 'trust', 'bookings'],
});
