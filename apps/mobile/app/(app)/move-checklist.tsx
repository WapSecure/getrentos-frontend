import { ScrollView, View } from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckSquare } from 'lucide-react-native';
import { EmptyState, ErrorState, Skeleton, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { renterApi, type MoveInChecklistItem } from '@/lib/api/renter';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function MoveChecklist() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const moveInQuery = useQuery({
    queryKey: qk.renter.moveInChecklist,
    queryFn: renterApi.moveInChecklist,
  });
  const moveOutQuery = useQuery({
    queryKey: qk.renter.moveOutChecklist,
    queryFn: renterApi.moveOutChecklist,
  });

  // Ticks show at once; a refused toggle flips back with a toast.
  const flip = (key: string) => (old: unknown) =>
    (old as MoveInChecklistItem[]).map((i) =>
      i.key === key ? { ...i, completed: !i.completed } : i
    );

  const toggleMoveIn = useOptimisticMutation({
    mutationFn: (key: string) => renterApi.toggleMoveInChecklistItem(key),
    patches: (key) => [{ queryKey: qk.renter.moveInChecklist, update: flip(key) }],
    errorMessage: 'Could not update this item.',
    onSuccess: (updated) => {
      qc.setQueryData<typeof moveInQuery.data>(qk.renter.moveInChecklist, (old) =>
        old?.map((i) => (i.key === updated.key ? updated : i))
      );
    },
  });

  const toggleMoveOut = useOptimisticMutation({
    mutationFn: (key: string) => renterApi.toggleMoveOutChecklistItem(key),
    patches: (key) => [{ queryKey: qk.renter.moveOutChecklist, update: flip(key) }],
    errorMessage: 'Could not update this item.',
    onSuccess: (updated) => {
      qc.setQueryData<typeof moveOutQuery.data>(qk.renter.moveOutChecklist, (old) =>
        old?.map((i) => (i.key === updated.key ? updated : i))
      );
    },
  });

  const isLoading = moveInQuery.isLoading || moveOutQuery.isLoading;
  // A failed refresh keeps the saved checklist on screen.
  const isError =
    (moveInQuery.isError && !moveInQuery.data) || (moveOutQuery.isError && !moveOutQuery.data);
  const hasMoveIn = (moveInQuery.data?.length ?? 0) > 0;
  const hasMoveOut = (moveOutQuery.data?.length ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Moving journey"
        title="Move checklist"
        subtitle="Stay organized before and after moving day"
        onBack={() => goBack()}
      />

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={200} radius={16} />
        </View>
      ) : isError ? (
        <ErrorState
          onRetry={() => {
            moveInQuery.refetch();
            moveOutQuery.refetch();
          }}
        />
      ) : !hasMoveIn && !hasMoveOut ? (
        <EmptyState
          icon={<CheckSquare size={34} color={colors.mutedForeground} />}
          title="Nothing to check off right now"
          description="This shows up around your move-in date, and again when it's time to move out."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing['2xl'],
          }}
        >
          {hasMoveIn ? (
            <ChecklistSection
              title="Move-in checklist"
              items={moveInQuery.data!}
              onToggle={(key) => toggleMoveIn.mutate(key)}
            />
          ) : null}
          {hasMoveOut ? (
            <ChecklistSection
              title="Move-out checklist"
              items={moveOutQuery.data!}
              onToggle={(key) => toggleMoveOut.mutate(key)}
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
