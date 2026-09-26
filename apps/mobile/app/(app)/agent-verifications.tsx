import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, CheckCircle, XCircle } from 'lucide-react-native';
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agentApi,
  type AgentVerification,
  type AgentVerificationSubjectType,
} from '@/lib/api/agent';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const SUBJECT_TYPES: AgentVerificationSubjectType[] = ['TENANT', 'BUYER', 'PROPERTY'];
const SUBJECT_LABEL: Record<AgentVerificationSubjectType, string> = {
  TENANT: 'Tenant',
  BUYER: 'Buyer',
  PROPERTY: 'Property',
};

function CheckRow({ label, done }: { label: string; done: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {done ? (
        <CheckCircle size={14} color={colors.success} />
      ) : (
        <XCircle size={14} color={colors.mutedForeground} />
      )}
      <Text variant="caption" color={done ? 'success' : 'mutedForeground'}>
        {label}
      </Text>
    </View>
  );
}

export default function AgentVerifications() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [subjectType, setSubjectType] = useState<AgentVerificationSubjectType | undefined>(
    undefined
  );

  const query = useQuery({
    queryKey: qk.agent.verifications(1, 50),
    queryFn: () => agentApi.verifications(1, 50),
  });

  const items = (query.data?.items ?? []).filter(
    (v) => !subjectType || v.subjectType === subjectType
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Trust operations"
          title="Verifications"
          subtitle="Identity and property field checks"
          onBack={() => router.back()}
        />
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <ScrollView
          accessibilityLabel="Filter verifications by subject"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}
        >
          <Chip
            label="All"
            selected={!subjectType}
            onPress={() => setSubjectType(undefined)}
            size="sm"
          />
          {SUBJECT_TYPES.map((s) => (
            <Chip
              key={s}
              label={SUBJECT_LABEL[s]}
              selected={subjectType === s}
              onPress={() => setSubjectType(s)}
              size="sm"
            />
          ))}
        </ScrollView>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={110} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BadgeCheck size={34} color={colors.mutedForeground} />}
          title="No verifications"
          description={
            subjectType
              ? 'No verifications match this filter.'
              : 'Verification visits you submit will appear here.'
          }
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentVerification }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => router.push(`/(app)/agent-task/${item.taskId}`)}>
                <Card elevated>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.subjectName}
                      </Text>
                      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                        {SUBJECT_LABEL[item.subjectType]} · {item.property?.title ?? 'Property'}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {formatDate(item.createdAt, 'short')}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 4 }}>
                        <CheckRow label="ID verified" done={item.idVerified} />
                        <CheckRow label="Address confirmed" done={item.addressConfirmed} />
                      </View>
                    </View>
                    <Badge label="Submitted" tone="success" />
                  </View>
                </Card>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
