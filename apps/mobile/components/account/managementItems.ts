import { router } from 'expo-router';
import {
  ClipboardList,
  History,
  MessageSquareText,
  PiggyBank,
  ShieldCheck,
} from 'lucide-react-native';
import type { SettingsItem } from './SettingsList';

/**
 * The property-control rows landlords and owners share: the same screens on
 * the web sit under both portals, so both account menus list them in one group.
 */
export const managementItems = (): SettingsItem[] => [
  {
    key: 'inspections',
    label: 'Inspections',
    description: 'Move-in, move-out and routine reports',
    icon: ClipboardList,
    onPress: () => router.push('/(app)/property-inspections'),
  },
  {
    key: 'deposits',
    label: 'Deposits',
    description: 'Held, deducted and returned',
    icon: PiggyBank,
    onPress: () => router.push('/(app)/deposits'),
  },
  {
    key: 'approvals',
    label: 'Approvals',
    description: 'Manager spend above your limit',
    icon: ShieldCheck,
    onPress: () => router.push('/(app)/spend-approvals'),
  },
  {
    key: 'queries',
    label: 'Questions to your manager',
    description: 'Ask, with a 24-hour reply promise',
    icon: MessageSquareText,
    onPress: () => router.push('/(app)/manager-queries'),
  },
  {
    key: 'activity',
    label: 'Activity log',
    description: 'What others did on your properties',
    icon: History,
    onPress: () => router.push('/(app)/property-activity'),
  },
];
