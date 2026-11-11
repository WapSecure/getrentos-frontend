import { Alert, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Constants from 'expo-constants';
import {
  ArrowRightLeft,
  BadgeCheck,
  Banknote,
  CalendarClock,
  BarChart3,
  BellRing,
  Scale,
  Building,
  DoorClosed,
  UserCog,
  Zap,
  BedDouble,
  CalendarCheck,
  CircleHelp,
  ClipboardCheck,
  FileSignature,
  FileStack,
  FileText,
  Gift,
  Globe,
  HandCoins,
  Handshake,
  HardHat,
  KeyRound,
  LogOut,
  Megaphone,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  Wrench,
  MessageCircle,
} from '@sureground/icons/native';
import {
  Avatar,
  Button,
  Divider,
  Screen,
  Text,
  ThemeToggle,
  useTheme,
} from '@sureground/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useTrustItems } from '@/components/account/useTrustItems';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { managementItems } from '@/components/account/managementItems';

const go = (href: Href) => () => router.push(href);

export default function LandlordAccount() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();
  const { verified } = useIdentityVerification();
  const trustItems = useTrustItems('landlord', {
    audience: 'tenants',
    identityHint: 'Required to publish listings',
  });

  const renting: SettingsItem[] = [
    {
      key: 'applications',
      label: 'Applications',
      description: 'Review and decide on applicants',
      icon: FileText,
      onPress: go('/(app)/landlord-applications'),
    },
    {
      key: 'units',
      label: 'Units',
      description: 'Every unit across your properties',
      icon: DoorClosed,
      onPress: go('/(app)/landlord-units'),
    },
    {
      key: 'leases',
      label: 'Leases',
      description: 'Drafts, signatures and renewals',
      icon: FileSignature,
      onPress: go('/(app)/landlord-leases'),
    },
    {
      key: 'payments',
      label: 'Rent payments',
      description: 'Rent collected, payouts and arrears',
      icon: Banknote,
      onPress: go('/(app)/landlord-payments'),
    },
    {
      key: 'notices',
      label: 'Notices',
      description: 'Arrears ladder, service and notice periods',
      icon: BellRing,
      onPress: go('/(app)/landlord-notices'),
    },
    {
      key: 'legal-cases',
      label: 'Legal cases',
      description: 'Evictions, recovery and disputes in court',
      icon: Scale,
      onPress: go('/(app)/legal-cases'),
    },
    {
      key: 'automations',
      label: 'Automations',
      description: 'Announcements, reminder rules and templates',
      icon: Zap,
      onPress: go('/(app)/landlord-automations'),
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      description: 'Open issues across your properties',
      icon: Wrench,
      onPress: go('/(app)/landlord-maintenance'),
    },
    {
      key: 'listings',
      label: 'Listings',
      description: 'What is live, paused or draft',
      icon: Megaphone,
      onPress: go('/(app)/landlord-listings'),
    },
    {
      key: 'viewings',
      label: 'Viewings',
      description: 'Confirm visits and host video viewings',
      icon: CalendarClock,
      onPress: go('/(app)/landlord-viewings'),
    },
    {
      key: 'offers',
      label: 'Offers',
      description: 'Buyers bidding on property you sell',
      icon: HandCoins,
      onPress: go('/(app)/landlord-offers'),
    },
    {
      key: 'leads',
      label: 'Leads',
      description: 'Enquiries to follow up',
      icon: Users,
      onPress: go('/(app)/landlord-leads'),
    },
  ];

  const business: SettingsItem[] = [
    {
      key: 'financials',
      label: 'Financials',
      description: 'Profit, expenses and owner statements',
      icon: BarChart3,
      onPress: go('/(app)/landlord-financials'),
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Leases, ownership papers, reports',
      icon: FileStack,
      onPress: go('/(app)/landlord-documents'),
    },
    {
      key: 'home-care',
      label: 'Home care',
      description: 'Work orders, assets and servicing',
      icon: ClipboardCheck,
      onPress: go('/(app)/home-care'),
    },
    {
      key: 'vendors',
      label: 'Vendors',
      description: 'Tradespeople you assign to repairs',
      icon: HardHat,
      onPress: go('/(app)/landlord-vendors'),
    },
    {
      key: 'host',
      label: 'Short-stay hosting',
      description: 'Nightly stays, bookings and payouts',
      icon: BedDouble,
      onPress: go('/(app)/host'),
    },
    {
      key: 'microsite',
      label: 'Microsite',
      description: 'Your public page and its address',
      icon: Globe,
      onPress: go('/(app)/landlord-microsite'),
    },
    {
      key: 'get-managed',
      label: 'Get it managed',
      description: 'Sureground Managed or a vetted firm',
      icon: UserCog,
      onPress: go('/(app)/get-managed'),
    },
    {
      key: 'change-manager',
      label: 'Change manager',
      description: 'Hand a property to a firm, Sureground or yourself',
      icon: ArrowRightLeft,
      onPress: go('/(app)/change-manager'),
    },
    {
      key: 'agency',
      label: 'Run a management firm',
      description: 'Start a firm, or join one you were invited to',
      icon: Building,
      onPress: go('/(app)/agency-setup'),
    },
    {
      key: 'team',
      label: 'Realtors & agents',
      description: 'Approve who represents you and where',
      icon: Handshake,
      onPress: go('/(app)/representatives'),
    },
    {
      key: 'stays',
      label: 'Browse short stays',
      description: 'Find and book a stay as a guest',
      icon: Search,
      onPress: go('/(app)/shortlets'),
    },
    {
      key: 'my-stays',
      label: 'My stays',
      description: 'Stays you have booked as a guest',
      icon: CalendarCheck,
      onPress: go('/(app)/shortlet-bookings'),
    },
    {
      key: 'referrals',
      label: 'Referrals',
      description: 'Invite others, earn rewards',
      icon: Gift,
      onPress: go('/(app)/referrals'),
    },
  ];

  const trust: SettingsItem[] = [
    ...trustItems,
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'What tenants say about you',
      icon: Star,
      onPress: go('/(app)/landlord-reviews'),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'settings',
      label: 'Profile & preferences',
      description: 'Profile, payout, automation and alerts',
      icon: SlidersHorizontal,
      onPress: go('/(app)/landlord-settings'),
    },
    {
      key: 'billing',
      label: 'Plan & billing',
      description: 'What’s included and your receipts',
      icon: BadgeCheck,
      onPress: go('/(app)/billing'),
    },
    {
      key: 'text-messages',
      label: 'Text messages',
      description: 'SMS or WhatsApp for urgent alerts',
      icon: MessageCircle,
      onPress: go('/(app)/whatsapp-settings'),
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
      onPress: go('/(app)/help?messages=/(app)/(landlord)/messages'),
    },
  ];

  return (
    <Screen>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={[
          profile?.legalName ?? 'Sureground landlord',
          profile?.email,
          verified ? 'verified' : 'not verified',
        ]
          .filter(Boolean)
          .join(', ')}
        style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg }}
      >
        <Avatar name={profile?.legalName} size={76} />
        <Text variant="heading" style={{ marginTop: spacing.sm }}>
          {profile?.legalName ?? 'Sureground landlord'}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        <Text
          variant="caption"
          color="primary"
          style={{ fontWeight: '700', marginTop: spacing.xs }}
        >
          Landlord
        </Text>
      </View>

      <WorkspaceSwitcher />

      <SettingsGroup title="Renting" items={renting} />
      <SettingsGroup title="Portfolio & growth" items={business} />
      <SettingsGroup title="Tenancy & oversight" items={managementItems()} />
      <SettingsGroup title="Trust & reputation" items={trust} />
      <SettingsGroup
        title="Settings"
        items={settings}
        footer={
          <>
            <Divider />
            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <Text variant="bodyStrong">Appearance</Text>
              <ThemeToggle variant="segmented" />
            </View>
          </>
        }
      />

      <Button
        label="Sign out"
        variant="outline"
        icon={<LogOut size={16} color={colors.foreground} />}
        onPress={() =>
          Alert.alert('Sign out of Sureground?', 'You can sign back in any time.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: signOut },
          ])
        }
      />
      <Text variant="caption" color="mutedForeground" center style={{ marginBottom: spacing.lg }}>
        Sureground {Constants.expoConfig?.version ?? ''}
      </Text>
    </Screen>
  );
}
