import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Contact } from 'lucide-react-native';
import {
  Avatar,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { residentApi, type ResidentHousehold } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function ResidentDirectory() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();

  const household = useQuery({
    queryKey: qk.resident.household,
    queryFn: () => residentApi.getMyHousehold(),
  });
  const directory = useQuery({
    queryKey: qk.resident.directory,
    queryFn: () => residentApi.getDirectory(),
    enabled: !!household.data?.directoryOptIn,
  });

  // A preference: the switch moves at once and goes back if the server refuses.
  const toggleOptIn = useOptimisticMutation({
    mutationFn: (optIn: boolean) => residentApi.setDirectoryOptIn(optIn),
    patches: (optIn) => [
      {
        queryKey: qk.resident.household,
        update: (old) => ({ ...(old as ResidentHousehold), directoryOptIn: optIn }),
      },
    ],
    invalidate: [qk.resident.directory],
    errorMessage: "Couldn't update that. Try again.",
    onSuccess: (updated) => qc.setQueryData(qk.resident.household, updated),
  });

  const optedIn = household.data?.directoryOptIn ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Community"
        title="Directory"
        subtitle="Connect with opted-in neighbors"
        onBack={() => router.back()}
      />
      <Screen>
        <Card elevated>
          <SwitchRow
            label="Show my household in the directory"
            description="Neighbors will see your unit, name and contact info."
            value={optedIn}
            onValueChange={(v) => toggleOptIn.mutate(v)}
            disabled={household.isLoading}
          />
        </Card>

        {!optedIn ? (
          <EmptyState
            icon={<Contact size={34} color={colors.mutedForeground} />}
            title="Opt in to see your neighbors"
            description="Turn on the toggle above to view and be listed in the resident directory."
          />
        ) : directory.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={60} radius={16} />
            <Skeleton height={60} radius={16} />
          </View>
        ) : directory.data && directory.data.length > 0 ? (
          directory.data.map((entry) => (
            <Card key={entry.id} elevated>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={entry.residentName} size={40} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{entry.residentName}</Text>
                  <Text variant="caption" color="mutedForeground">
                    Unit {entry.unitLabel}
                    {entry.contactPhone ? ` · ${entry.contactPhone}` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<Contact size={34} color={colors.mutedForeground} />}
            title="No neighbors listed yet"
            description="Nobody else has opted in to the directory so far."
          />
        )}
      </Screen>
    </View>
  );
}
