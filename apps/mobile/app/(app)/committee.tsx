import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Landmark } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  type BadgeTone,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { residentApi, type CommitteeTitle } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';

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

export default function ResidentCommittee() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.resident.committee,
    queryFn: () => residentApi.listCommittee(),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Committee" />
      <Screen>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={64} radius={16} />
            <Skeleton height={64} radius={16} />
          </View>
        ) : query.data && query.data.length > 0 ? (
          query.data.map((m) => (
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
          ))
        ) : (
          <EmptyState
            icon={<Landmark size={34} color={colors.mutedForeground} />}
            title="No committee yet"
            description="Your estate manager hasn't appointed a committee."
          />
        )}
      </Screen>
    </View>
  );
}
