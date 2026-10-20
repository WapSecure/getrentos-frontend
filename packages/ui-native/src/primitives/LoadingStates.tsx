import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { CloudOff } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { EmptyState, ErrorState, Skeleton } from './misc';
import { LinkButton } from './FormControls';

/* ------------------------------- Skeletons ------------------------------- */

function Group({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
      style={style}
    >
      {children}
    </View>
  );
}

// Varied widths read as text rather than a barcode.
const LINE_WIDTHS = ['62%', '48%', '70%', '54%'] as const;

export interface ListSkeletonProps {
  rows?: number;
  /** `row`: avatar and two lines, for lists. `card`: a block per item, for card feeds. */
  variant?: 'row' | 'card';
  /** Card height for the `card` variant. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Stand-in for a list while it first loads, shaped like the rows that will replace it. */
export function ListSkeleton({
  rows = 4,
  variant = 'row',
  height = 104,
  style,
}: ListSkeletonProps) {
  const { spacing, radius, colors } = useTheme();
  if (variant === 'card') {
    return (
      <Group style={[{ gap: spacing.md }, style]}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={height} radius={radius.lg} />
        ))}
      </Group>
    );
  }
  return (
    <Group
      style={[
        {
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.lg,
        },
        style,
      ]}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.lg,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: colors.border,
          }}
        >
          <Skeleton height={40} width={40} radius={radius.md} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton height={13} width={LINE_WIDTHS[i % 4]} />
            <Skeleton height={11} width={LINE_WIDTHS[(i + 2) % 4]} />
          </View>
          <Skeleton height={13} width={52} />
        </View>
      ))}
    </Group>
  );
}

/** Stand-in for a row of stat tiles (two per line). */
export function StatSkeleton({
  count = 4,
  style,
}: {
  count?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { spacing, radius, colors } = useTheme();
  return (
    <Group style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flexBasis: '47%',
            flexGrow: 1,
            gap: 10,
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Skeleton height={11} width="55%" />
          <Skeleton height={22} width="70%" />
        </View>
      ))}
    </Group>
  );
}

/** Stand-in for a detail screen: a title block, then label and value lines. */
export function DetailSkeleton({
  lines = 5,
  style,
}: {
  lines?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { spacing, radius } = useTheme();
  return (
    <Group style={[{ gap: spacing.lg }, style]}>
      <Skeleton height={180} radius={radius.lg} />
      <View style={{ gap: 10 }}>
        <Skeleton height={22} width="68%" />
        <Skeleton height={14} width="40%" />
      </View>
      <View style={{ gap: spacing.md }}>
        {Array.from({ length: lines }).map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton height={13} width="34%" />
            <Skeleton height={13} width="28%" />
          </View>
        ))}
      </View>
    </Group>
  );
}

/* ------------------------------- QueryState ------------------------------- */

/** The parts of a TanStack Query result this needs; pass the query itself. */
export interface QueryLike {
  data?: unknown;
  isPending?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => unknown;
}

export interface QueryStateProps {
  query: QueryLike;
  /** Shown only on the very first load. Defaults to a list skeleton. */
  skeleton?: ReactNode;
  /** True when the data loaded and there is nothing to show. */
  isEmpty?: boolean;
  empty?: { icon?: ReactNode; title: string; description?: string; action?: ReactNode };
  errorTitle?: string;
  errorDescription?: string;
  /** Wraps the skeleton, error and empty states, e.g. to match the screen's side padding. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * Loading, failed, empty or loaded, the same way on every screen.
 *
 * Stale-while-revalidate: once a screen has data (fresh or from the disk
 * cache) it keeps showing it while refreshing, and a failed refresh leaves it
 * in place with a quiet notice instead of swapping in an error page.
 */
export function QueryState({
  query,
  skeleton,
  isEmpty,
  empty,
  errorTitle = 'This did not load',
  errorDescription = 'Check your connection, then try again.',
  style,
  children,
}: QueryStateProps) {
  const { colors, spacing, radius } = useTheme();
  const hasData = query.data !== undefined;

  if (!hasData && query.isError) {
    return (
      <View style={style}>
        <ErrorState
          title={errorTitle}
          description={errorDescription}
          onRetry={query.refetch ? () => void query.refetch?.() : undefined}
        />
      </View>
    );
  }
  if (!hasData) return <View style={style}>{skeleton ?? <ListSkeleton />}</View>;
  if (isEmpty && empty)
    return (
      <View style={style}>
        <EmptyState {...empty} />
      </View>
    );

  return (
    <>
      {query.isError ? (
        <View style={style}>
          <View
            accessibilityLiveRegion="polite"
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: colors.secondary,
                marginBottom: spacing.md,
              },
            ]}
          >
            <CloudOff size={16} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              Could not refresh. Showing what was saved on this device.
            </Text>
            {query.refetch ? (
              <LinkButton
                label="Retry"
                accessibilityLabel="Retry loading"
                onPress={() => void query.refetch?.()}
                style={{ minHeight: 32 }}
              />
            ) : null}
          </View>
        </View>
      ) : null}
      {children}
    </>
  );
}
