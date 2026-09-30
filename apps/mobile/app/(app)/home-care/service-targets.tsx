import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  FormAlert,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  PRIORITIES,
  homeCareApi,
  minutesLabel,
  type Priority,
  type SlaPolicy,
} from '@/lib/api/homeCare';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/host/HostUI';
import { PriorityTag } from '@/components/homecare/WorkOrderCard';

/** Sensible starting targets (minutes) when a home has none for a priority. */
const DEFAULTS: Record<Priority, { respond: number; resolve: number; escalate: number }> = {
  URGENT: { respond: 30, resolve: 4 * 60, escalate: 60 },
  HIGH: { respond: 2 * 60, resolve: 24 * 60, escalate: 4 * 60 },
  MEDIUM: { respond: 8 * 60, resolve: 72 * 60, escalate: 24 * 60 },
  LOW: { respond: 24 * 60, resolve: 7 * 24 * 60, escalate: 48 * 60 },
};

const BREACH: Record<string, string> = {
  RESPONSE_BREACHED: 'Nobody responded in time',
  RESOLUTION_BREACHED: 'Not fixed in time',
  ESCALATION_DUE: 'Due for escalation',
};

/** How fast each priority must be answered and fixed, per home; and what's slipped. */
export default function ServiceTargets() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState('');
  const home = propertyId || homes.data?.[0]?.id || '';
  const [editing, setEditing] = useState<{ priority: Priority; policy?: SlaPolicy } | null>(null);
  const policies = useQuery({
    queryKey: qk.homeCare.sla(home),
    queryFn: () => homeCareApi.slaPolicies(home),
    enabled: !!home,
  });
  const escalations = useQuery({
    queryKey: [...qk.homeCare.sla(home), 'escalations'],
    queryFn: () => homeCareApi.escalations(home),
    enabled: !!home,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={policies.isRefetching}
            onRefresh={() => {
              policies.refetch();
              escalations.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Home care"
          title="Response times"
          subtitle="Promises for each priority, per home"
          onBack={() => router.back()}
        />
        {(homes.data?.length ?? 0) > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {homes.data!.map((h) => (
              <Chip
                key={h.id}
                label={h.name}
                selected={home === h.id}
                onPress={() => setPropertyId(h.id)}
              />
            ))}
          </ScrollView>
        ) : null}
        {!home ? (
          homes.isPending ? (
            <Skeleton height={200} radius={radius.lg} />
          ) : (
            <EmptyState title="No homes yet" description="Add a property first." />
          )
        ) : policies.isError && !policies.data ? (
          <ErrorState onRetry={() => policies.refetch()} />
        ) : policies.isPending ? (
          <Skeleton height={240} radius={radius.lg} />
        ) : (
          <>
            {escalations.data?.items.length ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="heading" accessibilityRole="header">
                  Slipping now
                </Text>
                {escalations.data.items.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/home-care/work-order/[id]',
                        params: { id: e.id },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${e.issueTitle}. ${BREACH[e.breach] ?? e.breach}`}
                  >
                    <Card
                      elevated
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        borderWidth: 1,
                        borderColor: colors.destructive,
                      }}
                    >
                      <AlertTriangle size={18} color={colors.destructive} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>
                          {e.issueTitle}
                        </Text>
                        <Text variant="caption" style={{ color: colors.destructive }}>
                          {BREACH[e.breach] ?? e.breach}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.mutedForeground} />
                    </Card>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Card elevated padding="none">
              {PRIORITIES.slice()
                .reverse()
                .map((p, i) => {
                  const policy = policies.data?.items.find((x) => x.priority === p.value);
                  return (
                    <View key={p.value}>
                      {i ? <Divider /> : null}
                      <Pressable
                        onPress={() => setEditing({ priority: p.value, policy })}
                        accessibilityRole="button"
                        accessibilityLabel={`${p.label} priority. ${policy ? `Respond within ${minutesLabel(policy.responseTargetMinutes)}, fix within ${minutesLabel(policy.resolutionTargetMinutes)}` : 'No targets set'}. Edit`}
                        style={({ pressed }) => ({
                          padding: spacing.lg,
                          gap: spacing.xs,
                          backgroundColor: pressed ? colors.secondary : 'transparent',
                        })}
                      >
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                        >
                          <PriorityTag p={p.value} />
                          <View style={{ flex: 1 }} />
                          {policy && !policy.isActive ? (
                            <Text variant="caption" color="mutedForeground">
                              Off
                            </Text>
                          ) : null}
                          <ChevronRight size={18} color={colors.mutedForeground} />
                        </View>
                        <Text variant="callout">
                          {policy
                            ? `Respond in ${minutesLabel(policy.responseTargetMinutes)} · fix in ${minutesLabel(policy.resolutionTargetMinutes)}`
                            : 'No targets yet: tap to set them'}
                        </Text>
                        {policy ? (
                          <Text variant="caption" color="mutedForeground">
                            Escalates after {minutesLabel(policy.escalationTargetMinutes)}
                            {policy.emergencyRoutingEnabled ? ' · emergencies routed first' : ''}
                          </Text>
                        ) : null}
                      </Pressable>
                    </View>
                  );
                })}
            </Card>
          </>
        )}
      </ScrollView>
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          editing ? `${PRIORITIES.find((p) => p.value === editing.priority)?.label} priority` : ''
        }
      >
        {editing ? (
          <TargetForm
            propertyId={home}
            priority={editing.priority}
            policy={editing.policy}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function TargetForm({
  propertyId,
  priority,
  policy,
  onDone,
}: {
  propertyId: string;
  priority: Priority;
  policy?: SlaPolicy;
  onDone: () => void;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const d = DEFAULTS[priority];
  // Edited in hours (minutes under an hour for the fastest targets).
  const [respond, setRespond] = useState(
    Math.max(1, Math.round((policy?.responseTargetMinutes ?? d.respond) / 30)) / 2
  );
  const [resolve, setResolve] = useState(
    Math.max(1, Math.round((policy?.resolutionTargetMinutes ?? d.resolve) / 60))
  );
  const [escalate, setEscalate] = useState(
    Math.max(1, Math.round((policy?.escalationTargetMinutes ?? d.escalate) / 60))
  );
  const [emergency, setEmergency] = useState(
    policy?.emergencyRoutingEnabled ?? priority === 'URGENT'
  );
  const [active, setActive] = useState(policy?.isActive ?? true);
  const save = useMutation({
    mutationFn: () => {
      const body = {
        responseTargetMinutes: Math.round(respond * 60),
        resolutionTargetMinutes: resolve * 60,
        escalationTargetMinutes: escalate * 60,
        emergencyRoutingEnabled: emergency,
        isActive: active,
      };
      return policy
        ? homeCareApi.updateSlaPolicy(policy.id, body)
        : homeCareApi.addSlaPolicy({ propertyId, priority, ...body });
    },
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.homeCare.sla(propertyId) });
      toast.show('Targets saved. New work orders use them.', 'success');
      onDone();
    },
  });
  return (
    <View style={{ gap: spacing.md }}>
      <Stepper
        label="Respond within"
        hint="Acknowledge the report"
        value={respond}
        min={0.5}
        max={72}
        step={0.5}
        suffix=" h"
        onChange={setRespond}
      />
      <Stepper
        label="Fix within"
        value={resolve}
        min={1}
        max={24 * 30}
        step={resolve >= 48 ? 24 : 1}
        suffix=" h"
        onChange={setResolve}
      />
      <Stepper
        label="Escalate after"
        hint="If still open, it’s flagged for senior attention"
        value={escalate}
        min={1}
        max={24 * 14}
        step={escalate >= 48 ? 24 : 1}
        suffix=" h"
        onChange={setEscalate}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
        <Text variant="body" style={{ flex: 1 }}>
          Route emergencies first
        </Text>
        <Switch
          value={emergency}
          onValueChange={setEmergency}
          accessibilityLabel="Route emergencies first"
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
        <Text variant="body" style={{ flex: 1 }}>
          Targets on
        </Text>
        <Switch
          value={active}
          onValueChange={setActive}
          accessibilityLabel="Targets on"
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      {resolve * 60 < respond * 60 ? (
        <FormAlert tone="warning" message="The fix time is shorter than the response time." />
      ) : null}
      {save.error ? (
        <FormAlert
          message={save.error instanceof ApiError ? save.error.message : 'Could not save.'}
        />
      ) : null}
      <Button label="Save targets" loading={save.isPending} onPress={() => save.mutate()} />
    </View>
  );
}
