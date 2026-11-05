import { ScrollView, View } from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Divider,
  QueryState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { realtorApi, type RealtorNotificationPreference } from '@/lib/api/realtor';
import { haptics } from '@/lib/haptics';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { categorySendsEmail } from '@getrentos/shared';
import { goBack } from '@/lib/goBack';

const COPY: Record<string, { label: string; hint: string }> = {
  offers: { label: 'Offers', hint: 'A buyer offers or counters on your listing' },
  messages: { label: 'Messages', hint: 'A client writes to you' },
  clients: { label: 'Clients', hint: 'A client approves you or assigns a property' },
  payments: { label: 'Commission & payouts', hint: 'Commission is earned or a payout lands' },
  reviews: { label: 'Reviews', hint: 'A client reviews you' },
};

/**
 * Which updates buzz the phone, and which are also emailed. Everything still
 * lands in Notifications; this only decides what interrupts. Email exists only
 * for the kinds GetRentos emails (offers and commission), so only those rows
 * offer it.
 */
export default function RealtorNotificationSettings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const key = qk.realtor.notificationPreferences;
  const query = useQuery({ queryKey: key, queryFn: realtorApi.notificationPreferences });

  const save = useOptimisticMutation({
    mutationFn: (next: RealtorNotificationPreference[]) =>
      realtorApi.updateNotificationPreferences(next),
    patches: (next) => [{ queryKey: key, update: () => next }],
    errorMessage: 'Could not save that.',
    onSuccess: (saved) => qc.setQueryData(key, saved),
  });

  const set = (id: string, channel: 'push' | 'email', value: boolean) => {
    void haptics.tap();
    save.mutate((query.data ?? []).map((p) => (p.id === id ? { ...p, [channel]: value } : p)));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow="Settings"
        title="Alerts"
        subtitle="What buzzes your phone, and what’s emailed"
        onBack={() => goBack()}
      />
      <QueryState query={query} skeleton={<Skeleton height={320} radius={radius.lg} />}>
        <>
          <Card elevated padding="none">
            {(query.data ?? []).map((p, i) => {
              const copy = COPY[p.id] ?? { label: p.id, hint: '' };
              return (
                <View key={p.id}>
                  {i ? <Divider /> : null}
                  <SwitchRow
                    label={copy.label}
                    description={copy.hint || undefined}
                    value={p.push}
                    onValueChange={(v) => set(p.id, 'push', v)}
                    style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
                  />
                  {categorySendsEmail(p.id) ? (
                    <SwitchRow
                      label="Also by email"
                      accessibilityLabel={`${copy.label}: also by email`}
                      value={p.email}
                      onValueChange={(v) => set(p.id, 'email', v)}
                      style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}
                    />
                  ) : null}
                </View>
              );
            })}
          </Card>
          <Text variant="caption" color="mutedForeground">
            Muted updates still appear in Notifications. Email is sent only for offers and money,
            not for messages or reviews. If no push arrives at all, check that notifications are
            allowed for GetRentos in your phone’s settings.
          </Text>
        </>
      </QueryState>
    </ScrollView>
  );
}
