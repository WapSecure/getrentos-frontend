import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Divider,
  PressableScale,
  Progress,
  QueryState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  trustApi,
  TRUST_STATUS,
  type TrustPortal,
  type TrustRequirementKey,
  type TrustStatus,
} from '@/lib/api/trust';
import { formatDate } from '@/lib/format';

const PORTAL_NOUN: Record<TrustPortal, string> = {
  renter: 'renting',
  buyer: 'buying',
  landlord: 'letting your properties',
  owner: 'selling and letting your properties',
  agent: 'working as an agent',
  realtor: 'working as a realtor',
  manager: 'managing properties',
  estate: 'managing your estate',
};

const WAITING: ReadonlySet<TrustStatus> = new Set([
  'VERIFIED',
  'PENDING_PROVIDER',
  'PENDING_REVIEW',
  'UNAVAILABLE',
]);

function StatusBadge({ status }: { status: TrustStatus }) {
  return <Badge label={TRUST_STATUS[status].label} tone={TRUST_STATUS[status].tone} />;
}

// Every value comes from GET /trust/overview.
export function TrustOverview({
  portal,
  onAction,
  moreDetails,
  identityExtra,
}: {
  portal: TrustPortal;
  onAction: (key: TrustRequirementKey) => void;
  moreDetails?: ReactNode;
  /** A row under the identity summary, e.g. the identity checks for investing from abroad. */
  identityExtra?: ReactNode;
}) {
  const { colors, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: qk.trust.overview(portal),
    queryFn: () => trustApi.overview(portal),
    refetchInterval: (q) =>
      q.state.data?.requirements.some((r) => r.status === 'PENDING_PROVIDER') ? 5000 : false,
  });
  const d = query.data;

  return (
    <QueryState
      query={query}
      style={{ paddingHorizontal: spacing.xl }}
      skeleton={
        <View style={{ gap: spacing.md }}>
          <Skeleton height={160} radius={16} />
          <Skeleton height={240} radius={16} />
        </View>
      }
    >
      {d ? (
        <Screen padded>
          {/* Identity and score: side by side in meaning, never merged. */}
          <Card elevated padding="none">
            <View style={{ padding: spacing.lg, gap: spacing.xs }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text variant="caption" color="mutedForeground">
                  Identity
                </Text>
                <StatusBadge status={d.identity.status} />
              </View>
              <Text variant="callout">{d.identity.detail}</Text>
              {d.identity.dueBy ? (
                <Text variant="caption" color="mutedForeground">
                  Take it by {formatDate(d.identity.dueBy, 'medium')}.
                </Text>
              ) : null}
            </View>
            {identityExtra}
            <Divider />
            <View style={{ padding: spacing.lg, gap: spacing.xs }}>
              <Text variant="caption" color="mutedForeground">
                Trust score
              </Text>
              {d.score ? (
                <>
                  <Text variant="display" style={{ fontSize: 34, fontWeight: '700' }}>
                    {d.score.total}
                    <Text variant="callout" color="mutedForeground">
                      {' '}
                      / 100
                    </Text>
                  </Text>
                  {d.score.stage ? (
                    <Text variant="caption" color="mutedForeground">
                      {d.score.stage.label}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text variant="callout" color="mutedForeground">
                  Scores are not switched on yet. Your verification still counts in full.
                </Text>
              )}
            </View>
            {d.nextAction ? (
              <>
                <Divider />
                <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                  <Text variant="callout">Next: {d.nextAction.label}</Text>
                  <Button label="Continue" fullWidth onPress={() => onAction(d.nextAction!.key)} />
                </View>
              </>
            ) : null}
          </Card>

          <View style={{ gap: spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <Text variant="heading">Needed for {PORTAL_NOUN[portal]}</Text>
              <Text variant="caption" color="mutedForeground">
                {d.requirements.filter((r) => r.status === 'VERIFIED').length} of{' '}
                {d.requirements.length}
              </Text>
            </View>
            <Card elevated padding="none">
              {d.requirements.map((r, i) => {
                const actionable = !WAITING.has(r.status);
                const rowStyle = {
                  flexDirection: 'row' as const,
                  gap: spacing.md,
                  padding: spacing.lg,
                };
                return (
                  <View key={r.key}>
                    {i > 0 ? <Divider /> : null}
                    {actionable ? (
                      <PressableScale
                        onPress={() => onAction(r.key)}
                        accessibilityRole="button"
                        accessibilityLabel={`${r.label}, ${TRUST_STATUS[r.status].label}. ${r.detail}`}
                        style={rowStyle}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="bodyStrong">{r.label}</Text>
                          <Text variant="caption" color="mutedForeground">
                            {r.detail}
                          </Text>
                          {r.dueBy ? (
                            <Text variant="caption" color="warning">
                              By {formatDate(r.dueBy, 'medium')}
                            </Text>
                          ) : null}
                        </View>
                        <StatusBadge status={r.status} />
                      </PressableScale>
                    ) : (
                      // Nothing to do: a plain row, so it is not dimmed like a disabled control.
                      <View
                        accessible
                        accessibilityLabel={`${r.label}, ${TRUST_STATUS[r.status].label}. ${r.detail}`}
                        style={rowStyle}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="bodyStrong">{r.label}</Text>
                          <Text variant="caption" color="mutedForeground">
                            {r.detail}
                          </Text>
                          {r.dueBy ? (
                            <Text variant="caption" color="warning">
                              By {formatDate(r.dueBy, 'medium')}
                            </Text>
                          ) : null}
                        </View>
                        <StatusBadge status={r.status} />
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>
          </View>

          <Card elevated padding="none">
            <PressableScale
              onPress={() => setOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg }}
            >
              <Text variant="bodyStrong">How this works</Text>
              {open ? (
                <ChevronUp size={18} color={colors.mutedForeground} />
              ) : (
                <ChevronDown size={18} color={colors.mutedForeground} />
              )}
            </PressableScale>
            {open ? (
              <View style={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}>
                <Text variant="caption" color="mutedForeground">
                  Identity says who you are: your NIN checked against official records and a live
                  selfie, checked by Smile ID. It is the same in every part of Sureground.
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Your trust score says how much history backs you. Checks that do not apply to you
                  never count against it.
                </Text>
                {d.requirements.map((r) => (
                  <Text key={r.key} variant="caption" color="mutedForeground">
                    {r.label}: {r.why}
                  </Text>
                ))}
                {(d.notOffered ?? []).length > 0 ? (
                  <View style={{ gap: 4 }}>
                    <Text variant="caption">Not offered yet</Text>
                    {(d.notOffered ?? []).map((check) => (
                      <Text key={check.key} variant="caption" color="mutedForeground">
                        {check.label}: {check.detail}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {d.score ? (
                  <View style={{ gap: spacing.sm }}>
                    {d.score.dimensions.map((dim) => (
                      <View key={dim.id} style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text variant="caption">{dim.label}</Text>
                          <Text variant="caption" color="mutedForeground">
                            {dim.earned} / {dim.weight}
                          </Text>
                        </View>
                        <Progress value={dim.weight > 0 ? dim.earned / dim.weight : 0} height={6} />
                      </View>
                    ))}
                    {d.score.penalty > 0 ? (
                      <Text variant="caption" color="warning">
                        A penalty of −{d.score.penalty} is applied for unresolved issues.
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {moreDetails}
              </View>
            ) : null}
          </Card>
        </Screen>
      ) : null}
    </QueryState>
  );
}
