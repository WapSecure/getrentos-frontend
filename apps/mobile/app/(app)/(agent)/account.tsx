import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Building2,
  CircleHelp,
  ClipboardCheck,
  FileStack,
  Gauge,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import { Screen } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentApi } from '@/lib/api/agent';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup, type SettingsItem } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { AccountFooter, AccountHeader, AppearanceFooter } from '@/components/account/AccountParts';

const go = (href: Href) => () => router.push(href);

export default function AgentAccount() {
  const { profile } = useAuth();
  // The agent profile adds what the session doesn't carry: ratings and tasks done.
  const agent = useQuery({ queryKey: qk.agent.profile, queryFn: agentApi.profile }).data;
  const verified = !!profile?.isVerified;

  const work: SettingsItem[] = [
    {
      key: 'properties',
      label: 'My properties',
      description: 'Properties assigned to you',
      icon: Building2,
      onPress: go('/(app)/agent-properties'),
    },
    {
      key: 'inspections',
      label: 'Inspections',
      description: 'Reports you’ve recorded',
      icon: ClipboardCheck,
      onPress: go('/(app)/agent-inspections'),
    },
    {
      key: 'verifications',
      label: 'Verifications',
      description: 'Verification visits you’ve submitted',
      icon: BadgeCheck,
      onPress: go('/(app)/agent-verifications'),
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Inspection reports, forms, IDs',
      icon: FileStack,
      onPress: go('/(app)/agent-documents'),
    },
    {
      key: 'sync',
      label: 'Sync status',
      description: 'Field records and their sync state',
      icon: RefreshCw,
      onPress: go('/(app)/agent-sync'),
    },
  ];

  const trust: SettingsItem[] = [
    {
      key: 'trust',
      label: 'Trust profile',
      description: 'Your score and badges',
      icon: Gauge,
      value: profile ? String(profile.trustScore) : undefined,
      onPress: go('/(app)/agent-trust-profile'),
    },
    {
      key: 'identity',
      label: 'Identity verification',
      description: verified ? undefined : 'Verify your ID and licence',
      icon: ShieldCheck,
      value: verified ? 'Verified' : 'Not verified',
      tone: verified ? 'success' : 'warning',
      onPress: go('/(app)/verify-identity'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'Ratings from your clients',
      icon: Star,
      value: agent && agent.reviewCount > 0 ? agent.reviewAverage.toFixed(1) : undefined,
      onPress: go('/(app)/agent-reviews'),
    },
  ];

  const settings: SettingsItem[] = [
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
      onPress: go('/(app)/help?messages=/(app)/(agent)/messages'),
    },
  ];

  return (
    <Screen>
      <AccountHeader
        role="Field agent"
        fallbackName="GetRentos agent"
        note={
          agent?.completedTasks
            ? `${agent.completedTasks} ${agent.completedTasks === 1 ? 'task' : 'tasks'} completed`
            : undefined
        }
      />
      <WorkspaceSwitcher />
      <SettingsGroup title="Field work" items={work} />
      <SettingsGroup title="Trust & reputation" items={trust} />
      <SettingsGroup title="Settings" items={settings} footer={<AppearanceFooter />} />
      <AccountFooter />
    </Screen>
  );
}
