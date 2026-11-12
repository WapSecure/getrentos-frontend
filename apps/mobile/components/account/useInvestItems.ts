import { router } from 'expo-router';
import { Globe } from '@sureground/icons/native';
import { useDiasporaAvailability } from '@/hooks/useDiasporaAvailability';
import type { SettingsItem } from './SettingsList';

/** The Diaspora Invest workspace row, only while the API has it switched on. */
export function useInvestItems(): SettingsItem[] {
  const { enabled } = useDiasporaAvailability();
  if (!enabled) return [];
  return [
    {
      key: 'invest',
      label: 'Invest from abroad',
      description: 'Purchases, property care and identity checks',
      icon: Globe,
      onPress: () => router.push('/(app)/invest'),
    },
  ];
}
