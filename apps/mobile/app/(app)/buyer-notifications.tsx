import { Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
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
import {
  buyerSettingsApi,
  BUYER_NOTIFICATION_CATEGORY_LABEL,
  type BuyerNotificationPreference,
} from '@/lib/api/buyerSettings';
import { ApiError } from '@/lib/api/client';

export default function BuyerNotificationSettings() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.buyer.notificationPreferences,
    queryFn: buyerSettingsApi.getNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: (next: BuyerNotificationPreference[]) =>
      buyerSettingsApi.updateNotificationPreferences(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: qk.buyer.notificationPreferences });
      const previous = qc.getQueryData<BuyerNotificationPreference[]>(
        qk.buyer.notificationPreferences
      );
      qc.setQueryData(qk.buyer.notificationPreferences, next);
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.buyer.notificationPreferences, ctx.previous);
      toast.show(
        err instanceof ApiError ? err.message : 'Could not update that preference.',
        'error'
      );
    },
    onSuccess: (updated) => qc.setQueryData(qk.buyer.notificationPreferences, updated),
  });

  const setChannel = (id: string, key: 'email' | 'push', value: boolean) => {
    const next = (query.data ?? []).map((p) => (p.id === id ? { ...p, [key]: value } : p));
    mutation.mutate(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Notifications</Text>
      </View>

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
                <Text variant="bodyStrong">
                  {BUYER_NOTIFICATION_CATEGORY_LABEL[pref.id] ?? pref.id}
                </Text>
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
