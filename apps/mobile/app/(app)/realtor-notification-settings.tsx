import { ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Divider,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { realtorApi, type RealtorNotificationPreference } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const COPY: Record<string, { label: string; hint: string }> = {
  offers: { label: 'Offers', hint: 'A buyer offers or counters on your listing' },
  messages: { label: 'Messages', hint: 'A client writes to you' },
  clients: { label: 'Clients', hint: 'A client approves you or assigns a property' },
  payments: { label: 'Commission & payouts', hint: 'Commission is earned or a payout lands' },
  reviews: { label: 'Reviews', hint: 'A client reviews you' },
};

/**
 * Which updates buzz the phone. Everything still lands in Notifications; this
 * only decides what interrupts. The email channel is kept as it was saved.
 */
export default function RealtorNotificationSettings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const key = qk.realtor.notificationPreferences;
  const query = useQuery({ queryKey: key, queryFn: realtorApi.notificationPreferences });

  const save = useMutation({
    mutationFn: (next: RealtorNotificationPreference[]) =>
      realtorApi.updateNotificationPreferences(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RealtorNotificationPreference[]>(key);
      qc.setQueryData(key, next);
      return { previous };
    },
    onError: (err, _next, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.show(err instanceof ApiError ? err.message : 'Could not save that.', 'error');
    },
    onSuccess: (saved) => qc.setQueryData(key, saved),
  });

  const setPush = (id: string, push: boolean) => {
    void haptics.tap();
    save.mutate((query.data ?? []).map((p) => (p.id === id ? { ...p, push } : p)));
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
        title="Push alerts"
        subtitle="Choose what buzzes your phone"
        onBack={() => router.back()}
      />
      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data ? (
        <Skeleton height={320} radius={radius.lg} />
      ) : (
        <>
          <Card elevated padding="none">
            {query.data.map((p, i) => {
              const copy = COPY[p.id] ?? { label: p.id, hint: '' };
              return (
                <View key={p.id}>
                  {i ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                      minHeight: 64,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{copy.label}</Text>
                      {copy.hint ? (
                        <Text variant="caption" color="mutedForeground">
                          {copy.hint}
                        </Text>
                      ) : null}
                    </View>
                    <Switch
                      value={p.push}
                      onValueChange={(v) => setPush(p.id, v)}
                      accessibilityLabel={`${copy.label} push alerts`}
                      trackColor={{ true: colors.primary, false: colors.border }}
                    />
                  </View>
                </View>
              );
            })}
          </Card>
          <Text variant="caption" color="mutedForeground">
            Muted updates still appear in Notifications. If nothing arrives at all, check that
            notifications are allowed for GetRentos in your phone’s settings.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
