import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  CircleHelp,
  FileSignature,
  KeyRound,
  MessageCircleQuestion,
  ShieldCheck,
  Users,
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
      <SettingsGroup title="Your firm" items={work} />
      <SettingsGroup title="Settings" items={settings} footer={<AppearanceFooter />} />
      <AccountFooter />
    </Screen>
  );
}
