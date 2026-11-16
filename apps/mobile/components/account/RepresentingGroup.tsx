import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Users } from '@sureground/icons/native';
import { landBuyerExtrasApi, type Appointment } from '@/lib/api/landBuyerExtras';
import { qk } from '@/lib/query/keys';
import { SettingsGroup } from './SettingsList';

const isCurrent = (a: Appointment) => a.status === 'INVITED' || a.status === 'ACTIVE';

/** Anyone a buyer appoints can hold any role, so every account screen offers the desk once asked. */
export function RepresentingGroup() {
  const q = useQuery({
    queryKey: qk.buyerLand.representing,
    queryFn: landBuyerExtrasApi.representing,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const current = (q.data ?? []).filter(isCurrent);
  if (current.length === 0) return null;
  const invited = current.filter((a) => a.status === 'INVITED').length;
  return (
    <SettingsGroup
      title="Representing"
      items={[
        {
          key: 'representing',
          label: 'Buyers you represent',
          description:
            invited > 0
              ? `${invited} ${invited === 1 ? 'invitation' : 'invitations'} waiting for you`
              : 'Land deals you follow or co-approve',
          icon: Users,
          tone: invited > 0 ? 'warning' : 'default',
          onPress: () => router.push('/(app)/land-representing'),
        },
      ]}
    />
  );
}
