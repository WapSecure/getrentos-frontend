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
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { agentApi, type AgentNotificationPreference } from '@/lib/api/agent';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

const COPY: Record<string, { label: string; hint: string }> = {
  verification: {
    label: 'Verification results',
    hint: 'A verification you ran is approved or sent back',
  },
  system: { label: 'Account and listing updates', hint: 'Changes to your account or assignments' },
};

/**
 * Which agent updates buzz the phone, and which are also emailed. Everything
 * still lands in Notifications; this only decides what interrupts.
 */
export default function AgentNotificationSettings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const key = qk.agent.notificationPreferences;
  const query = useQuery({ queryKey: key, queryFn: agentApi.notificationPreferences });

  const save = useOptimisticMutation({
    mutationFn: (next: AgentNotificationPreference[]) =>
      agentApi.updateNotificationPreferences(next),
    patches: () => [{ queryKey: key, update: (_old, next) => next }],
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
                  <SwitchRow
                    label="Also by email"
                    accessibilityLabel={`${copy.label}: also by email`}
                    value={p.email}
                    onValueChange={(v) => set(p.id, 'email', v)}
                    style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}
                  />
                </View>
              );
            })}
          </Card>
          <Text variant="caption" color="mutedForeground">
            Muted updates still appear in Notifications. If no push arrives at all, check that
            notifications are allowed for Sureground in your phone’s settings.
          </Text>
        </>
      </QueryState>
    </ScrollView>
  );
}
