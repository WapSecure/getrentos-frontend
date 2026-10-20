import { ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Divider,
  QueryState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_DESCRIPTION,
  NOTIFICATION_CATEGORY_LABEL,
  notificationPreferencesApi,
  type NotificationCategory,
  type NotificationPreference,
} from '@/lib/api/notificationPreferences';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { categorySendsEmail } from '@getrentos/shared';
import { goBack } from '@/lib/goBack';

const CHANNELS: { key: 'email' | 'push' | 'inApp'; label: string }[] = [
  { key: 'push', label: 'Push' },
  { key: 'email', label: 'Email' },
  { key: 'inApp', label: 'In-app' },
];

export default function NotificationSettings() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.renter.notificationPreferences,
    queryFn: notificationPreferencesApi.list,
  });

  const mutation = useMutation({
    mutationFn: ({
      category,
      patch,
    }: {
      category: NotificationCategory;
      patch: Partial<Pick<NotificationPreference, 'email' | 'push' | 'inApp'>>;
    }) => notificationPreferencesApi.update(category, patch),
    onMutate: async ({ category, patch }) => {
      await qc.cancelQueries({ queryKey: qk.renter.notificationPreferences });
      const previous = qc.getQueryData<NotificationPreference[]>(qk.renter.notificationPreferences);
      qc.setQueryData<NotificationPreference[]>(qk.renter.notificationPreferences, (old) =>
        old?.map((p) => (p.category === category ? { ...p, ...patch } : p))
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.renter.notificationPreferences, ctx.previous);
      toast.show(
        err instanceof ApiError ? err.message : 'Could not update that preference.',
        'error'
      );
    },
    onSuccess: (updated) => {
      qc.setQueryData<NotificationPreference[]>(qk.renter.notificationPreferences, (old) =>
        old?.map((p) => (p.category === updated.category ? updated : p))
      );
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Communication"
        title="Notifications"
        subtitle="Choose what reaches you and where"
        onBack={() => goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <QueryState
          query={query}
          skeleton={
            <View style={{ gap: spacing.md }}>
              <Skeleton height={90} />
              <Skeleton height={90} />
              <Skeleton height={90} />
            </View>
          }
          errorDescription="Couldn't load your notification preferences."
          isEmpty={!query.data?.length}
          empty={{
            title: 'No preferences yet',
            description: 'Preferences will appear here once your account is set up.',
          }}
        >
          <Text variant="caption" color="mutedForeground">
            Choose how you&apos;d like to hear about each type of update.
          </Text>
          {NOTIFICATION_CATEGORIES.map((category) => {
            const pref = query.data?.find((p) => p.category === category);
            if (!pref) return null;
            return (
              <Card key={category} elevated>
                <Text variant="bodyStrong">{NOTIFICATION_CATEGORY_LABEL[category]}</Text>
                <Text variant="caption" color="mutedForeground" style={{ marginTop: 2 }}>
                  {NOTIFICATION_CATEGORY_DESCRIPTION[category]}
                </Text>
                <Divider style={{ marginVertical: spacing.sm }} />
                {CHANNELS.filter(
                  // Email exists only for the categories that are emailed.
                  ({ key }) => key !== 'email' || categorySendsEmail(category)
                ).map(({ key, label }) => (
                  <SwitchRow
                    key={key}
                    label={label}
                    value={pref[key]}
                    onValueChange={(value) =>
                      mutation.mutate({ category, patch: { [key]: value } })
                    }
                  />
                ))}
              </Card>
            );
          })}
        </QueryState>
      </ScrollView>
    </View>
  );
}
