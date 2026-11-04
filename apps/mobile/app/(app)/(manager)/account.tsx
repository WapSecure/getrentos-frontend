import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Building,
  CircleHelp,
  ClipboardCheck,
  FileSignature,
  Handshake,
  HandCoins,
  KeyRound,
  Landmark,
  MessageCircleQuestion,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react-native';
import { Screen } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agencyApi } from '@/lib/api/agency';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { AccountFooter, AccountHeader, AppearanceFooter } from '@/components/account/AccountParts';

const go = (href: Href) => () => router.push(href);

export default function AgencyAccount() {
  const dashboard = useQuery({ queryKey: qk.agency.dashboard, queryFn: agencyApi.dashboard });
  const { verified, known: identityKnown, label: identityLabel } = useIdentityVerification();

  const work: SettingsItem[] = [
    {
      key: 'clients',
      label: 'Clients',
      description: 'Owners your firm acts for',
      icon: Users,
      onPress: go('/(app)/(manager)/clients'),
    },
    {
      key: 'engagements',
      label: 'Engagements',
      description: 'Mandates, signatures and notice',
      icon: FileSignature,
      onPress: go('/(app)/(manager)/engagements'),
    },
    {
      key: 'ask',
      label: 'Ask GetRentos',
      description: 'About your clients, rent, arrears and repairs',
      icon: MessageCircleQuestion,
      onPress: () => router.push({ pathname: '/(app)/ask', params: { persona: 'agency' } }),
    },
  ];

  const firm: SettingsItem[] = [
    {
      key: 'team',
      label: 'Team',
      description: 'Who works here and what they can do',
      icon: UserCog,
      onPress: go('/(app)/agency-team'),
    },
    {
      key: 'commissions',
      label: 'Commissions',
      description: 'Rate card, ledger and agent splits',
      icon: HandCoins,
      onPress: go('/(app)/agency-commissions'),
    },
    {
      key: 'payouts',
      label: 'Payouts',
      description: 'To the firm, your agents and you',
      icon: Wallet,
      onPress: go('/(app)/agency-payouts'),
    },
    {
      key: 'performance',
      label: 'Performance',
      description: 'Collection, repairs, payouts and retention',
      icon: BarChart3,
      onPress: go('/(app)/agency-performance'),
    },
    {
      key: 'home-care',
      label: 'Home management',
      description: 'Work orders on clients’ properties',
      icon: ClipboardCheck,
      onPress: go('/(app)/home-care'),
    },
    {
      key: 'realtors',
      label: 'Realtor access',
      description: 'Approve realtors for clients’ properties',
      icon: Handshake,
      onPress: go('/(app)/representatives'),
    },
    {
      key: 'protection',
      label: 'Client-money protection',
      description: 'Your scheme and cover',
      icon: Landmark,
      onPress: go('/(app)/agency-protection'),
    },
    {
      key: 'setup',
      label: 'Firm details',
      description: 'Registration and verification',
      icon: Building,
      onPress: go('/(app)/agency-setup'),
    },
  ];

  const settings: SettingsItem[] = [
    {
      key: 'identity',
      label: 'Identity verification',
      description: verified ? undefined : 'Verify your ID',
      icon: ShieldCheck,
      value: identityLabel,
      tone: verified ? 'success' : identityKnown ? 'warning' : undefined,
      onPress: go('/(app)/verify-identity'),
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
      onPress: go('/(app)/help'),
    },
  ];

  return (
    <Screen>
      <AccountHeader
        role="Property manager"
        fallbackName="GetRentos manager"
        note={dashboard.data?.firmName}
      />
      <WorkspaceSwitcher />
      <SettingsGroup title="Your work" items={work} />
      <SettingsGroup title="The firm" items={firm} />
      <SettingsGroup title="Settings" items={settings} footer={<AppearanceFooter />} />
      <AccountFooter />
    </Screen>
  );
}
