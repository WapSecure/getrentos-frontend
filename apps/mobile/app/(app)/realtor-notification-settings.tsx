import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Divider,
  ErrorState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { realtorApi, type RealtorNotificationPreference } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { categorySendsEmail } from '@getrentos/shared';

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
      )}
    </ScrollView>
  );
}
