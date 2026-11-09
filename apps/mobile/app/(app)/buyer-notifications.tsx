import { ScrollView, View } from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, QueryState, Skeleton, SwitchRow, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerSettingsApi,
  BUYER_NOTIFICATION_CATEGORY_LABEL,
  type BuyerNotificationPreference,
} from '@/lib/api/buyerSettings';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { categorySendsEmail } from '@sureground/shared';
import { goBack } from '@/lib/goBack';

export default function BuyerNotificationSettings() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.buyer.notificationPreferences,
    queryFn: buyerSettingsApi.getNotificationPreferences,
  });

  const mutation = useOptimisticMutation({
    mutationFn: (next: BuyerNotificationPreference[]) =>
      buyerSettingsApi.updateNotificationPreferences(next),
    patches: (next) => [{ queryKey: qk.buyer.notificationPreferences, update: () => next }],
    errorMessage: 'Could not update that preference.',
    onSuccess: (updated) => qc.setQueryData(qk.buyer.notificationPreferences, updated),
  });

  const setChannel = (id: string, key: 'email' | 'push', value: boolean) => {
    const next = (query.data ?? []).map((p) => (p.id === id ? { ...p, [key]: value } : p));
    mutation.mutate(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Buyer alerts"
        title="Notifications"
        subtitle="Choose how purchase updates reach you"
        onBack={() => goBack()}
      />

      <View style={{ flex: 1 }}>
        <QueryState
          query={query}
          skeleton={
            <View style={{ padding: spacing.xl, gap: spacing.md }}>
              <Skeleton height={70} />
              <Skeleton height={70} />
            </View>
          }
          errorDescription="Couldn't load your notification preferences."
          isEmpty={!query.data?.length}
          empty={{
            title: 'No preferences yet',
            description: 'Preferences will appear here once your account is set up.',
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.md,
            }}
          >
            {(query.data ?? []).map((pref) => (
              <Card key={pref.id} elevated>
                <Text variant="bodyStrong">
                  {BUYER_NOTIFICATION_CATEGORY_LABEL[pref.id] ?? pref.id}
                </Text>
                <View style={{ marginTop: spacing.sm }}>
                  <SwitchRow
                    label="Push"
                    accessibilityLabel={`${BUYER_NOTIFICATION_CATEGORY_LABEL[pref.id] ?? pref.id}: push notifications`}
                    value={pref.push}
                    onValueChange={(value) => setChannel(pref.id, 'push', value)}
                  />
                  {categorySendsEmail(pref.id) ? (
                    <SwitchRow
                      label="Email"
                      accessibilityLabel={`${BUYER_NOTIFICATION_CATEGORY_LABEL[pref.id] ?? pref.id}: email`}
                      value={pref.email}
                      onValueChange={(value) => setChannel(pref.id, 'email', value)}
                    />
                  ) : null}
                </View>
              </Card>
            ))}
          </ScrollView>
        </QueryState>
      </View>
    </View>
  );
}
