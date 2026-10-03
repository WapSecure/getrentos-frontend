import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import {
  Card,
  ErrorState,
  PressableScale,
  Price,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { relativeTime } from '@/lib/format';
import { BalanceVisibilityButton } from './BalanceVisibilityButton';

/**
 * The building blocks every portal's home screen is made of, so an owner and
 * a landlord open the app to the same shape: what needs you, the money, the
 * numbers, the shortcuts, what happened.
 */

export function dashboardGreeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ------------------------------ needs you first ---------------------------- */

type AttentionTone = 'info' | 'warning' | 'danger';

/** One thing waiting on the user, with where to deal with it. */
export function AttentionCard({
  Icon,
  title,
  detail,
  tone = 'info',
  onPress,
  accessibilityLabel,
}: {
  Icon: LucideIcon;
  title: string;
  detail?: ReactNode;
  tone?: AttentionTone;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { colors, spacing } = useTheme();
  const map: Record<AttentionTone, { fg: string; bg: string }> = {
    info: { fg: colors.primary, bg: colors.accent },
    warning: { fg: colors.warning, bg: colors.warningSubtle },
    danger: { fg: colors.destructive, bg: colors.destructiveSubtle },
  };
  const c = map[tone];
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Card
        elevated
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: c.bg,
        }}
      >
        <Icon size={20} color={c.fg} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{title}</Text>
          {typeof detail === 'string' ? (
            <Text variant="caption" color="mutedForeground">
              {detail}
            </Text>
          ) : (
            detail
          )}
        </View>
        <ChevronRight size={18} color={c.fg} />
      </Card>
    </PressableScale>
  );
}

/* -------------------------------- the money -------------------------------- */

/**
 * The headline figure, with the eye toggle. Anything passed as children (a
 * trend chart) is hidden along with the figure, since it shows the same money.
 */
export function PortfolioCard({
  label,
  amount,
  hint,
  loading,
  visible,
  onToggle,
  spokenLabel,
  children,
}: {
  label: string;
  amount: number;
  hint: string;
  loading: boolean;
  visible: boolean;
  onToggle: () => void;
  /** How a screen reader names the figure, e.g. "Portfolio value". */
  spokenLabel?: string;
  children?: ReactNode;
}) {
  const { spacing } = useTheme();
  const name = spokenLabel ?? label;
  return (
    <Card elevated style={{ gap: spacing.xs }}>
      <View
        accessible
        accessibilityLabel={
          loading
            ? `Loading ${name.toLowerCase()}`
            : visible
              ? `${name}, ${Math.round(amount).toLocaleString('en-NG')} naira. ${hint}`
              : `${name} hidden`
        }
        accessibilityState={{ busy: loading }}
        style={{ gap: spacing.xs }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            {label}
          </Text>
          <BalanceVisibilityButton visible={visible} onToggle={onToggle} />
        </View>
        {loading ? (
          <Skeleton height={30} width="60%" />
        ) : visible ? (
          <Price amount={amount} variant="title" />
        ) : (
          <Text variant="title">••••••</Text>
        )}
        <Text variant="caption" color="mutedForeground">
          {hint}
        </Text>
      </View>
      {children && visible && !loading ? (
        <View style={{ marginTop: spacing.sm }}>{children}</View>
      ) : null}
    </Card>
  );
}

/* ------------------------------ quick actions ------------------------------ */

export type QuickActionItem = {
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  /** A count worth noticing (open items); hidden at zero. */
  badge?: number;
};

export function QuickActions({ actions }: { actions: QuickActionItem[] }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title="Quick actions" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {actions.map(({ label, Icon, onPress, badge }) => (
          <PressableScale
            key={label}
            onPress={onPress}
            haptic={false}
            accessibilityRole="button"
            accessibilityLabel={badge ? `${label}, ${badge} open` : label}
            style={{
              flexBasis: '48%',
              flexGrow: 1,
              minHeight: 56,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Icon size={18} color={colors.primary} />
            <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
              {label}
            </Text>
            {badge ? (
              <Text variant="caption" color="primary" style={{ fontWeight: '800' }}>
                {badge}
              </Text>
            ) : null}
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

/* ----------------------------- recent activity ----------------------------- */

export type ActivityItem = {
  id: string;
  Icon: LucideIcon;
  title: string;
  detail?: string;
  timestamp: string;
};

/** The latest things that happened, newest first, each with what kind it was. */
export function ActivityFeed({
  items,
  loading,
  error,
  onRetry,
  emptyText,
  description,
}: {
  items: ActivityItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyText: string;
  description?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title="Recent activity" description={description} />
      {error ? (
        <ErrorState
          title="Recent activity is unavailable"
          description="Try again to load the latest updates."
          onRetry={onRetry}
        />
      ) : loading ? (
        <View style={{ gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={62} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Text variant="callout" color="mutedForeground">
          {emptyText}
        </Text>
      ) : (
        <Card elevated padding="none">
          {items.map((a, i) => (
            <View
              key={a.id}
              accessible
              accessibilityLabel={`${a.title}${a.detail ? `. ${a.detail}` : ''}, ${relativeTime(a.timestamp)}`}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.secondary,
                }}
              >
                <a.Icon size={15} color={colors.foreground} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="callout" style={{ fontWeight: '600' }}>
                  {a.title}
                </Text>
                {a.detail ? (
                  <Text variant="caption" color="mutedForeground">
                    {a.detail}
                  </Text>
                ) : null}
                <Text variant="caption" color="mutedForeground">
                  {relativeTime(a.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}
