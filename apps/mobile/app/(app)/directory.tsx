import { Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Contact } from 'lucide-react-native';
import {
  Avatar,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';

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

export default function ResidentDirectory() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const household = useQuery({
    queryKey: qk.resident.household,
    queryFn: () => residentApi.getMyHousehold(),
  });
  const directory = useQuery({
    queryKey: qk.resident.directory,
    queryFn: () => residentApi.getDirectory(),
    enabled: !!household.data?.directoryOptIn,
  });

  const toggleOptIn = useMutation({
    mutationFn: (optIn: boolean) => residentApi.setDirectoryOptIn(optIn),
    onSuccess: (updated) => {
      qc.setQueryData(qk.resident.household, updated);
      qc.invalidateQueries({ queryKey: qk.resident.directory });
    },
    onError: () => toast.show("Couldn't update that. Try again.", 'error'),
  });

  const optedIn = household.data?.directoryOptIn ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Directory" />
      <Screen>
        <Card elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">Show my household in the directory</Text>
              <Text variant="caption" color="mutedForeground">
                Neighbors will see your unit, name and contact info.
              </Text>
            </View>
            <Switch
              value={optedIn}
              onValueChange={(v) => toggleOptIn.mutate(v)}
              disabled={household.isLoading || toggleOptIn.isPending}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
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
