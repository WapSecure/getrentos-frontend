import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckSquare } from 'lucide-react-native';
import { EmptyState, ErrorState, Skeleton, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { renterApi } from '@/lib/api/renter';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function MoveChecklist() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [pendingKey, setPendingKey] = useState<string | undefined>(undefined);

  const moveInQuery = useQuery({
    queryKey: qk.renter.moveInChecklist,
    queryFn: renterApi.moveInChecklist,
  });
  const moveOutQuery = useQuery({
    queryKey: qk.renter.moveOutChecklist,
    queryFn: renterApi.moveOutChecklist,
  });

  const toggleMoveIn = useMutation({
    mutationFn: (key: string) => {
      setPendingKey(key);
      return renterApi.toggleMoveInChecklistItem(key);
    },
    onSuccess: (updated) => {
      qc.setQueryData<typeof moveInQuery.data>(qk.renter.moveInChecklist, (old) =>
        old?.map((i) => (i.key === updated.key ? updated : i))
      );
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update this item.', 'error'),
    onSettled: () => setPendingKey(undefined),
  });

  const toggleMoveOut = useMutation({
    mutationFn: (key: string) => {
      setPendingKey(key);
      return renterApi.toggleMoveOutChecklistItem(key);
    },
    onSuccess: (updated) => {
      qc.setQueryData<typeof moveOutQuery.data>(qk.renter.moveOutChecklist, (old) =>
        old?.map((i) => (i.key === updated.key ? updated : i))
      );
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update this item.', 'error'),
    onSettled: () => setPendingKey(undefined),
  });

  const isLoading = moveInQuery.isLoading || moveOutQuery.isLoading;
  const isError = moveInQuery.isError || moveOutQuery.isError;
  const hasMoveIn = (moveInQuery.data?.length ?? 0) > 0;
  const hasMoveOut = (moveOutQuery.data?.length ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Moving journey"
        title="Move checklist"
        subtitle="Stay organized before and after moving day"
        onBack={() => router.back()}
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
              pendingKey={pendingKey}
            />
          ) : null}
          {hasMoveOut ? (
            <ChecklistSection
              title="Move-out checklist"
              items={moveOutQuery.data!}
              onToggle={(key) => toggleMoveOut.mutate(key)}
              pendingKey={pendingKey}
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
