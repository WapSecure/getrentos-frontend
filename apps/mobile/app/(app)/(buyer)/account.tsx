import { router, type Href } from 'expo-router';
import {
  BedDouble,
  Bell,
  Calendar,
  CalendarCheck,
  CircleHelp,
  CreditCard,
  FileStack,
  Gauge,
  Heart,
  KeyRound,
  LandPlot,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
} from 'lucide-react-native';
import { Screen } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { AccountFooter, AccountHeader, AppearanceFooter } from '@/components/account/AccountParts';

const go = (href: Href) => () => router.push(href);

export default function BuyerAccount() {
  const { profile } = useAuth();
  const verified = !!profile?.isVerified;

  const buying: SettingsItem[] = [
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
    {
      key: 'trust',
      label: 'Trust profile',
      description: 'Your score and what sellers see',
      icon: Gauge,
      value: profile ? String(profile.trustScore) : undefined,
      onPress: go('/(app)/buyer-trust-profile'),
    },
    {
      key: 'identity',
      label: 'Identity verification',
      description: verified ? undefined : 'Verify your ID to make offers',
      icon: ShieldCheck,
      value: verified ? 'Verified' : 'Not verified',
      tone: verified ? 'success' : 'warning',
      onPress: go('/(app)/verify-identity'),
    },
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
      <AccountHeader role="Buyer" fallbackName="GetRentos buyer" />
      <WorkspaceSwitcher />
      <SettingsGroup title="Buying" items={buying} />
      <SettingsGroup title="Explore" items={explore} />
      <SettingsGroup title="Trust & reputation" items={trust} />
      <SettingsGroup title="Settings" items={settings} footer={<AppearanceFooter />} />
      <AccountFooter />
    </Screen>
  );
}
