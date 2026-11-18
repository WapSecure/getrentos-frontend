import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Landmark } from '@sureground/icons/native';
import {
  Avatar,
  Badge,
  type BadgeTone,
  Card,
  QueryState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { residentApi, type CommitteeTitle } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const TITLE_LABEL: Record<CommitteeTitle, string> = {
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  member: 'Member',
};

const TITLE_TONE: Record<CommitteeTitle, BadgeTone> = {
  president: 'info',
  vice_president: 'info',
  secretary: 'neutral',
  treasurer: 'warning',
  member: 'neutral',
};

export default function ResidentCommittee() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.resident.committee,
    queryFn: () => residentApi.listCommittee(),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Running the estate"
        title="Committee"
        subtitle="Who sits on your estate committee"
        onBack={() => goBack()}
      />
      <Screen>
        <QueryState
          query={query}
          skeleton={
            <View style={{ gap: spacing.md }}>
              <Skeleton height={64} radius={16} />
              <Skeleton height={64} radius={16} />
            </View>
          }
          isEmpty={!query.data?.length}
          empty={{
            icon: <Landmark size={34} color={colors.mutedForeground} />,
            title: 'No committee yet',
            description: "Your estate manager hasn't appointed a committee.",
          }}
        >
          {query.data?.map((m) => (
            <Card key={m.id} elevated>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={m.residentName} size={40} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{m.residentName}</Text>
                  <Text variant="caption" color="mutedForeground">
                    Unit {m.unitLabel}
                  </Text>
                </View>
                <Badge label={TITLE_LABEL[m.title]} tone={TITLE_TONE[m.title]} />
              </View>
            </Card>
          ))}
        </QueryState>
      </Screen>
    </View>
  );
}
