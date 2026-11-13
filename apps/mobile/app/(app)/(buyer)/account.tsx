import { router, type Href } from 'expo-router';
import {
  BedDouble,
  Bell,
  Calendar,
  CalendarCheck,
  CircleHelp,
  CreditCard,
  FileStack,
  Heart,
  KeyRound,
  LandPlot,
  MessageCircleQuestion,
  Users,
  Search,
  Star,
  UserRound,
  Wallet,
  UserCheck,
  Eye,
  ClipboardList,
} from '@sureground/icons/native';
import { Screen } from '@sureground/ui-native';
import { DEVELOPMENT_ENQUIRY_COPY } from '@sureground/shared/showroom';
import { useTrustItems } from '@/components/account/useTrustItems';
import { useInvestItems } from '@/components/account/useInvestItems';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { AccountFooter, AppearanceFooter, ProfileCard } from '@/components/account/AccountParts';

const go = (href: Href) => () => router.push(href);

export default function BuyerAccount() {
  const trustItems = useTrustItems('buyer', { audience: 'sellers' });
  const investItems = useInvestItems();

  const buying: SettingsItem[] = [
    ...investItems,
    {
      key: 'saved',
      label: 'Saved listings',
      description: 'Properties you’re tracking',
      icon: Heart,
      onPress: go('/(app)/buyer-saved'),
    },
    {
      key: 'viewings',
      label: 'Viewings',
      description: 'Requested and upcoming viewings',
      icon: Calendar,
      onPress: go('/(app)/buyer-viewings'),
    },
    {
      key: 'transactions',
      label: 'Purchases in progress',
      description: 'Payment and closing progress',
      icon: Wallet,
      onPress: go('/(app)/buyer-transactions'),
    },
    {
      key: 'developer-questions',
      label: DEVELOPMENT_ENQUIRY_COPY.historyTitle,
      description: 'What you asked about off-plan developments, and the answers',
      icon: MessageCircleQuestion,
      onPress: go('/(app)/developer-questions'),
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Proof of funds, preapprovals, title',
      icon: FileStack,
      onPress: go('/(app)/buyer-documents'),
    },
  ];

  const explore: SettingsItem[] = [
    {
      key: 'land',
      label: 'Land',
      description: 'Browse verified land parcels',
      icon: LandPlot,
      onPress: go('/(app)/land'),
    },
    {
      key: 'my-land',
      label: 'My land',
      description: 'Plots you hold and are paying for',
      icon: LandPlot,
      onPress: go('/(app)/buyer-land'),
    },
    {
      key: 'representing',
      label: 'Buyers you represent',
      description: 'Land deals you follow or co-approve',
      icon: Users,
      onPress: go('/(app)/land-representing'),
    },
    {
      key: 'land-watch',
      label: 'Land Watch',
      description: 'Inspections, alerts and reminders for land you own',
      icon: Eye,
      onPress: go('/(app)/land-watch'),
    },
    {
      key: 'land-inspections',
      label: 'Land inspections',
      description: 'Visits assigned to you as an inspector',
      icon: ClipboardList,
      onPress: go('/(app)/land-inspections'),
    },
    {
      key: 'land-consents',
      label: 'Land sale consents',
      description: 'Sales that need your consent as a co-owner or family member',
      icon: UserCheck,
      onPress: go('/(app)/land-consents'),
    },
    {
      key: 'stays',
      label: 'Short stays',
      description: 'Find and book a stay',
      icon: BedDouble,
      onPress: go('/(app)/shortlets'),
    },
    {
      key: 'bookings',
      label: 'My stays',
      description: 'Upcoming and past short stays',
      icon: CalendarCheck,
      onPress: go('/(app)/shortlet-bookings'),
    },
  ];

  const trust: SettingsItem[] = [
    ...trustItems,
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'Reviews you’ve left',
      icon: Star,
      onPress: go('/(app)/buyer-reviews'),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'profile',
      label: 'Profile',
      description: 'Your name and contact details',
      icon: UserRound,
      onPress: go('/(app)/buyer-profile'),
    },
    {
      key: 'payment',
      label: 'Payment method',
      description: 'Bank details for deposits',
      icon: CreditCard,
      onPress: go('/(app)/buyer-payment-method'),
    },
    {
      key: 'search',
      label: 'Search preferences',
      description: 'Budget, type and location filters',
      icon: Search,
      onPress: go('/(app)/buyer-search-preferences'),
    },
    {
      key: 'notifications',
      label: 'Notification settings',
      description: 'Which alerts you get, and how',
      icon: Bell,
      onPress: go('/(app)/buyer-notifications'),
    },
    {
      key: 'security',
      label: 'Security',
      description: 'Password, two-factor and app lock',
      icon: KeyRound,
      onPress: go('/(app)/security-settings'),
    },
    {
      key: 'help',
      label: 'Help centre',
      description: 'Answers and support',
      icon: CircleHelp,
      onPress: go('/(app)/help?messages=/(app)/(buyer)/messages'),
    },
  ];

  return (
    <Screen>
      <ProfileCard role="Buyer" fallbackName="Sureground buyer" />
      <WorkspaceSwitcher />
      <SettingsGroup title="Buying" items={buying} />
      <SettingsGroup title="Explore" items={explore} />
      <SettingsGroup title="Trust & reputation" items={trust} />
      <SettingsGroup title="Settings" items={settings} footer={<AppearanceFooter />} />
      <AccountFooter />
    </Screen>
  );
}
