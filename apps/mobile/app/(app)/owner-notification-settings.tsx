import { ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerNotificationPreference } from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

const LABEL: Record<string, string> = {
  offers: 'New offers and counters',
  escrow: 'Escrow milestones',
  verification: 'Verification status',
  messages: 'New messages',
  reviews: 'New reviews',
};

export default function OwnerNotificationSettings() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.owner.notificationPreferences,
    queryFn: ownerApi.notificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: (next: OwnerNotificationPreference[]) =>
      ownerApi.updateNotificationPreferences(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: qk.owner.notificationPreferences });
      const previous = qc.getQueryData<OwnerNotificationPreference[]>(
        qk.owner.notificationPreferences
      );
      qc.setQueryData(qk.owner.notificationPreferences, next);
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.owner.notificationPreferences, ctx.previous);
      toast.show(
        err instanceof ApiError ? err.message : 'Could not update that preference.',
        'error'
      );
    },
    onSuccess: (updated) => qc.setQueryData(qk.owner.notificationPreferences, updated),
  });

  const setChannel = (id: string, key: 'email' | 'push', value: boolean) => {
    const next = (query.data ?? []).map((p) => (p.id === id ? { ...p, [key]: value } : p));
    mutation.mutate(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Selling"
        title="Notifications"
        subtitle="Choose how selling updates reach you"
        onBack={() => router.back()}
      />

      {query.isLoading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={70} />
          <Skeleton height={70} />
        </View>
      ) : query.isError ? (
        <ErrorState
          description="Couldn't load your notification preferences."
          onRetry={() => query.refetch()}
        />
      ) : !query.data?.length ? (
        <EmptyState
          title="No preferences yet"
          description="Preferences will appear here once your account is set up."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.md,
          }}
        >
          {query.data.map((pref) => (
            <Card key={pref.id} elevated>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="bodyStrong">{LABEL[pref.id] ?? pref.id}</Text>
              </View>
              <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text variant="callout">Push</Text>
                  <Switch
                    value={pref.push}
                    onValueChange={(value) => setChannel(pref.id, 'push', value)}
                    accessibilityLabel={`${LABEL[pref.id] ?? pref.id}: push notifications`}
                    trackColor={{ true: colors.primary, false: colors.secondary }}
                    thumbColor={colors.card}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text variant="callout">Email</Text>
                  <Switch
                    value={pref.email}
                    onValueChange={(value) => setChannel(pref.id, 'email', value)}
                    accessibilityLabel={`${LABEL[pref.id] ?? pref.id}: email`}
                    trackColor={{ true: colors.primary, false: colors.secondary }}
                    thumbColor={colors.card}
                  />
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
