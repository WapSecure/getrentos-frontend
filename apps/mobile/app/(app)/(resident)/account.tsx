import { router, type Href } from 'expo-router';
import { CircleHelp, KeyRound, ShieldCheck } from 'lucide-react-native';
import { Screen } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { AccountFooter, AccountHeader, AppearanceFooter } from '@/components/account/AccountParts';

const go = (href: Href) => () => router.push(href);

export default function ResidentAccount() {
  const { profile } = useAuth();
  const verified = !!profile?.isVerified;

  const settings: SettingsItem[] = [
    {
      key: 'identity',
      label: 'Identity verification',
      icon: ShieldCheck,
      value: verified ? 'Verified' : 'Not verified',
      tone: verified ? 'success' : 'warning',
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
      <AccountHeader role="Resident" fallbackName="GetRentos resident" />
      <WorkspaceSwitcher />
      <SettingsGroup title="Settings" items={settings} footer={<AppearanceFooter />} />
      <AccountFooter />
    </Screen>
  );
}
