import { ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  QueryState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerNotificationPreference } from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { categorySendsEmail } from '@getrentos/shared';
import { goBack } from '@/lib/goBack';

const LABEL: Record<string, string> = {
  offers: 'New offers and counters',
  escrow: 'Payment milestones',
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
                <Text variant="bodyStrong">{LABEL[pref.id] ?? pref.id}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  <SwitchRow
                    label="Push"
                    accessibilityLabel={`${LABEL[pref.id] ?? pref.id}: push notifications`}
                    value={pref.push}
                    onValueChange={(value) => setChannel(pref.id, 'push', value)}
                  />
                  {categorySendsEmail(pref.id) ? (
                    <SwitchRow
                      label="Email"
                      accessibilityLabel={`${LABEL[pref.id] ?? pref.id}: email`}
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
