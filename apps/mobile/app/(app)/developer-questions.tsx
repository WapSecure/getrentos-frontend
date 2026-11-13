import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, MessageCircleQuestion } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormAlert,
  LinkButton,
  QueryState,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import {
  DEVELOPMENT_ENQUIRY_COPY as COPY,
  type BuyerDevelopmentEnquiry,
} from '@sureground/shared/showroom';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { developmentsApi } from '@/lib/api/developments';
import { ENQUIRY_STATUS_TONE } from '@/lib/askDeveloper';
import {
  DEVELOPER_QUESTIONS_PAGE_SIZE,
  mergeQuestionPages,
  nextQuestionsPage,
  questionDevelopmentLine,
  questionDevelopmentRoute,
  questionStatusLabel,
} from '@/lib/developerQuestions';
import { formatDate } from '@/lib/format';
import { goBack } from '@/lib/goBack';
import { qk } from '@/lib/query/keys';

/**
 * "Questions to developers", as on the web's /buyer/developer-questions: every question the buyer has
 * asked a developer, newest first, with the answer. Sureground takes no payment for a development.
 */
export default function DeveloperQuestions() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useInfiniteQuery({
    queryKey: qk.market.developmentEnquiryHistory,
    queryFn: ({ pageParam }) => developmentsApi.history(pageParam, DEVELOPER_QUESTIONS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextQuestionsPage,
  });
  const items = mergeQuestionPages(query.data?.pages);
  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Buying"
        title={COPY.historyTitle}
        subtitle={COPY.historyLead}
        onBack={() => goBack()}
      />
      <QueryState
        query={query}
        style={{ paddingHorizontal: spacing.xl }}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={160} radius={radius.lg} />
            ))}
          </View>
        }
      >
        <FlashList
          data={items}
          keyExtractor={(e) => e.id}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          // Inside the list, so pull to refresh still works with nothing in it.
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircleQuestion size={34} color={colors.mutedForeground} />}
              title={COPY.historyEmpty}
              description={COPY.historyEmptyHint}
              action={
                <Button
                  label="Browse off-plan developments"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push('/(app)/developments')}
                />
              }
            />
          }
          ListFooterComponent={
            query.hasNextPage ? (
              <View style={{ paddingTop: spacing.lg }}>
                <Button
                  label="Load more questions"
                  variant="secondary"
                  loading={query.isFetchingNextPage}
                  loadingLabel="Loading"
                  onPress={loadMore}
                />
              </View>
            ) : null
          }
          renderItem={({ item }: { item: BuyerDevelopmentEnquiry }) => (
            <QuestionCard enquiry={item} />
          )}
        />
      </QueryState>
    </View>
  );
}

function QuestionCard({ enquiry: e }: { enquiry: BuyerDevelopmentEnquiry }) {
  const { colors, spacing, radius } = useTheme();
  const d = e.development;
  const route = questionDevelopmentRoute(e);
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: spacing.sm,
        }}
      >
        <View style={{ flex: 1, minWidth: 160, gap: 2 }}>
          <Text variant="bodyStrong">{d.name}</Text>
          <Text variant="caption" color="mutedForeground">
            {questionDevelopmentLine(e)}
          </Text>
        </View>
        <Badge label={questionStatusLabel(e.status)} tone={ENQUIRY_STATUS_TONE[e.status]} />
      </View>

      <Text variant="caption" color="mutedForeground">
        You asked on {formatDate(e.createdAt)}
        {e.unitTypeName ? ` · ${e.unitTypeName}` : ''}
      </Text>
      <Text variant="body">{e.message}</Text>

      {e.answer ? (
        <View
          style={{
            gap: spacing.xs,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.secondary,
          }}
        >
          <Text variant="caption" color="mutedForeground" style={{ fontWeight: '600' }}>
            {d.developerName} answered
            {e.answeredAt ? ` on ${formatDate(e.answeredAt)}` : ''}
          </Text>
          <Text variant="body">{e.answer}</Text>
        </View>
      ) : e.status === 'CLOSED' ? (
        <Text variant="caption" color="mutedForeground">
          The developer closed this question{e.closedAt ? ` on ${formatDate(e.closedAt)}` : ''}{' '}
          without an answer.
        </Text>
      ) : (
        <FormAlert
          tone="info"
          message="No answer yet. If the developer does not answer within a few days, Sureground reminds them."
        />
      )}

      {route ? (
        <LinkButton
          label="View the development"
          icon={<ArrowRight size={16} color={colors.primary} />}
          accessibilityLabel={`View ${d.name}`}
          onPress={() => router.push(route as never)}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}
