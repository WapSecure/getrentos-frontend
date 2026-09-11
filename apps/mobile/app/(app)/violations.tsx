import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, TriangleAlert } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { residentApi, type ViolationStatus } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';

const STATUS_LABEL: Record<ViolationStatus, string> = {
  reported: 'Reported',
  warning_issued: 'Warning issued',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_TONE: Record<ViolationStatus, BadgeTone> = {
  reported: 'warning',
  warning_issued: 'danger',
  resolved: 'success',
  dismissed: 'neutral',
};

const CATEGORY_LABEL: Record<string, string> = {
  noise: 'Noise',
  unauthorized_parking: 'Unauthorized parking',
  pet_violation: 'Pet violation',
  property_maintenance: 'Property maintenance',
  other: 'Other',
};

function BackHeader({ title }: { title: string }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
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
      <Text variant="title">{title}</Text>
    </View>
  );
}

export default function ResidentViolations() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.resident.violations,
    queryFn: () => residentApi.listViolations(),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Violations" />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={90} radius={16} />
            <Skeleton height={90} radius={16} />
          </View>
        ) : query.data && query.data.length > 0 ? (
          query.data.map((v) => (
            <Card key={v.id} elevated>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="bodyStrong">{CATEGORY_LABEL[v.category] ?? v.category}</Text>
                <Badge label={STATUS_LABEL[v.status]} tone={STATUS_TONE[v.status]} />
              </View>
              <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                {v.description}
              </Text>
              {v.resolutionNotes ? (
                <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                  Resolution: {v.resolutionNotes}
                </Text>
              ) : null}
              <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                Reported {formatDate(v.createdAt, 'short')}
              </Text>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<TriangleAlert size={34} color={colors.mutedForeground} />}
            title="No violations"
            description="Your household has a clean record."
          />
        )}
      </Screen>
    </View>
  );
}
