import { View } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Card,
  QueryState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { residentApi, type ViolationStatus } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

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

export default function ResidentViolations() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.resident.violations,
    queryFn: () => residentApi.listViolations(),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Community standards"
        title="Violations"
        subtitle="Household notices and resolutions"
        onBack={() => goBack()}
      />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        <QueryState
          query={query}
          skeleton={
            <View style={{ gap: spacing.md }}>
              <Skeleton height={90} radius={16} />
              <Skeleton height={90} radius={16} />
            </View>
          }
          isEmpty={!query.data?.length}
          empty={{
            icon: <TriangleAlert size={34} color={colors.mutedForeground} />,
            title: 'No violations',
            description: 'Your household has a clean record.',
          }}
        >
          {query.data?.map((v) => (
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
          ))}
        </QueryState>
      </Screen>
    </View>
  );
}
