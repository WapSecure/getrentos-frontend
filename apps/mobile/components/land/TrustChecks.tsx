import { View } from 'react-native';
import { AlertTriangle, CircleDashed, ShieldCheck } from 'lucide-react-native';
import {
  checkedByText,
  LAND_ASSURANCE_TIER_DESCRIPTIONS,
  LAND_ASSURANCE_TIER_LABELS,
  type LandAssuranceTier,
  type LandNotVerifiedItem,
  type LandTrustLabel,
} from '@sureground/shared';
import { Badge, Text, useTheme } from '@sureground/ui-native';
import { formatDate } from '@/lib/format';

// Deliberately no single "Verified" tick: a buyer sees the gaps beside the passes.
export function TrustChecks({
  tier,
  labels = [],
  notVerified = [],
  compact = false,
}: {
  tier?: LandAssuranceTier;
  labels?: LandTrustLabel[];
  notVerified?: LandNotVerifiedItem[];
  compact?: boolean;
}) {
  const { colors, spacing } = useTheme();
  if (!tier && labels.length === 0 && notVerified.length === 0) return null;
  return (
    <View style={{ gap: spacing.md }}>
      {tier ? (
        <View style={{ gap: spacing.xs }}>
          <Badge label={LAND_ASSURANCE_TIER_LABELS[tier]} tone="success" />
          <Text variant="caption" color="mutedForeground">
            {LAND_ASSURANCE_TIER_DESCRIPTIONS[tier]}
          </Text>
        </View>
      ) : null}
      {labels.map((l) => (
        <View key={l.kind} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <ShieldCheck size={16} color={colors.success} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="callout" style={{ fontWeight: '600' }}>
              {l.title}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {formatDate(l.checkedAt, 'short')} · by {checkedByText(l.checkedBy)}
            </Text>
            {!compact
              ? l.scope.map((item) => (
                  <Text key={item} variant="caption" color="mutedForeground">
                    • {item}
                  </Text>
                ))
              : null}
          </View>
        </View>
      ))}
      {notVerified.length ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label" color="mutedForeground" uppercase>
            Not verified
          </Text>
          {notVerified.map((item) => (
            <View key={item.key} style={{ flexDirection: 'row', gap: spacing.sm }}>
              {item.status === 'FLAGGED' ? (
                <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 2 }} />
              ) : (
                <CircleDashed size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              )}
              <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                {item.label}
                {item.status === 'FLAGGED' ? ' (issue found)' : ' (not checked)'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
