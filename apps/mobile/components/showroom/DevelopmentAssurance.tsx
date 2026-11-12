import { View } from 'react-native';
import { BadgeCheck, Info, Wallet } from '@sureground/icons/native';
import { Card, SectionHeader, Text, useTheme } from '@sureground/ui-native';
import {
  DEVELOPMENT_NOT_CHECKED,
  DEVELOPMENT_PAYMENT_COPY,
  type ShowroomDevelopment,
} from '@sureground/shared/showroom';
import { longDay } from '@/lib/developments';

function Bullets({ lines }: { lines: readonly string[] }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {lines.map((line) => (
        <View key={line} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Text variant="callout" color="mutedForeground" accessible={false}>
            •
          </Text>
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Said plainly, near the price: the developer takes the money, not Sureground. Same words as the web. */
export function DevelopmentPaymentNotice({ compact = false }: { compact?: boolean }) {
  const { colors, spacing } = useTheme();
  return (
    <Card
      accessibilityRole="summary"
      style={{ gap: spacing.sm, backgroundColor: colors.secondary }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Wallet size={16} color={colors.mutedForeground} />
        <Text variant="bodyStrong">{DEVELOPMENT_PAYMENT_COPY.title}</Text>
      </View>
      <Text variant="callout" color="mutedForeground">
        {DEVELOPMENT_PAYMENT_COPY.lead}
      </Text>
      {compact ? null : <Bullets lines={DEVELOPMENT_PAYMENT_COPY.points} />}
    </Card>
  );
}

/** What Sureground staff checked before this development went live, and what nobody checked. */
export function DevelopmentChecks({ development }: { development: ShowroomDevelopment }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="What we checked" />
      <Text variant="callout" color="mutedForeground">
        A Sureground staff member made these four checks before this development went live. A
        development is not shown until all four pass.
      </Text>
      {development.checks.map((check) => (
        <Card
          key={check.kind}
          accessible
          accessibilityLabel={`${check.label}. ${check.detail} Checked ${longDay(check.checkedAt)}.`}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}
        >
          <BadgeCheck size={20} color={colors.success} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{check.label}</Text>
            <Text variant="callout" color="mutedForeground">
              {check.detail}
            </Text>
            <Text variant="caption" color="mutedForeground">
              Checked {longDay(check.checkedAt)}
            </Text>
          </View>
        </Card>
      ))}
      <Card style={{ gap: spacing.sm, backgroundColor: colors.secondary }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Info size={16} color={colors.mutedForeground} />
          <Text variant="bodyStrong" headingLevel={3}>
            What we did not check
          </Text>
        </View>
        <Bullets lines={DEVELOPMENT_NOT_CHECKED} />
      </Card>
    </View>
  );
}
