import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MessageCircleQuestion } from '@sureground/icons/native';
import {
  LISTING_ANSWER_SOURCE_LABEL,
  LISTING_QUESTION_TOPIC_INFO,
  UNMATCHED_ANSWER_TEXT,
  UNMATCHED_QUESTION_TOPIC,
  answerFor,
  answerQuestion,
  suggestedTopics,
  type ListingAnswer,
  type ListingAnswerSource,
  type ListingQuestionTopic,
  type ShowroomListing,
} from '@sureground/shared/showroom';
import {
  Badge,
  Button,
  Card,
  Chip,
  SectionHeader,
  Text,
  TextField,
  useTheme,
} from '@sureground/ui-native';
import { trackShowroom } from '@/lib/showroomAnalytics';

const SOURCE_TONE: Record<ListingAnswerSource, 'neutral' | 'success' | 'warning'> = {
  stated: 'neutral',
  checked: 'success',
  not_stated: 'warning',
};

const MAX_SHOWN = 5;
const QUESTION_MAX = 200;

interface Asked {
  key: number;
  question: string;
  /** Empty when the question matched nothing the listing could answer. */
  answers: ListingAnswer[];
}

const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

/**
 * Questions about a listing, answered only from its own data and always attributed, with the same
 * shared functions as the web page. Only the topic and the answer's source are ever recorded.
 */
export function ShowroomQuestions({
  listing,
  onAskLister,
  askListerLabel = 'Ask the lister',
}: {
  listing: ShowroomListing;
  /** The screen's existing enquiry flow. Without one, no ask button is shown. */
  onAskLister?: () => void;
  askListerLabel?: string;
}) {
  const { colors, radius, spacing } = useTheme();
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<Asked[]>([]);
  const nextKey = useRef(0);
  const suggestions = useMemo(() => suggestedTopics(listing), [listing]);

  const record = (topic: ListingQuestionTopic | 'unmatched', source: ListingAnswerSource) =>
    trackShowroom({
      name: 'listing_question',
      listingId: listing.id,
      market: listing.market,
      props: { topic, source },
    });

  const show = (text: string, answers: ListingAnswer[]) => {
    if (answers.length) answers.forEach((a) => record(a.topic, a.source));
    else record(UNMATCHED_QUESTION_TOPIC, 'not_stated');
    setAsked((prev) =>
      [{ key: nextKey.current++, question: text, answers }, ...prev].slice(0, MAX_SHOWN)
    );
  };

  const submit = () => {
    const text = question.trim();
    if (!text) return;
    show(text, answerQuestion(listing, text));
    setQuestion('');
  };

  const askTopic = (topic: ListingQuestionTopic) => {
    const text = LISTING_QUESTION_TOPIC_INFO[topic].question;
    show(text, [answerFor(listing, topic, text)]);
  };

  const askButton = onAskLister ? (
    <Button
      label={askListerLabel}
      variant="outline"
      size="sm"
      fullWidth={false}
      onPress={onAskLister}
    />
  ) : null;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader
        title={`Questions about this ${listing.market === 'land' ? 'parcel' : 'home'}`}
      />
      <Card style={{ gap: spacing.md }}>
        <Text variant="caption" color="mutedForeground">
          Answers come only from what this listing states, and say who stated it. Anything it does
          not cover, ask the lister.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
          <TextField
            value={question}
            onChangeText={setQuestion}
            maxLength={QUESTION_MAX}
            placeholder="Ask about parking, power, fees..."
            accessibilityLabel="Your question"
            leftIcon={<MessageCircleQuestion size={16} />}
            returnKeyType="send"
            onSubmitEditing={submit}
            containerStyle={{ flex: 1 }}
          />
          <Button
            label="Ask"
            variant="secondary"
            fullWidth={false}
            disabled={!question.trim()}
            onPress={submit}
          />
        </View>
        {suggestions.length ? (
          <View
            accessibilityLabel="Suggested questions"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
          >
            {suggestions.map((topic) => (
              <Chip
                key={topic}
                size="sm"
                label={LISTING_QUESTION_TOPIC_INFO[topic].question}
                onPress={() => askTopic(topic)}
              />
            ))}
          </View>
        ) : null}
        {asked.length ? (
          <View accessibilityLiveRegion="polite" style={{ gap: spacing.md }}>
            {asked.map((item) => (
              <View
                key={item.key}
                style={{
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  backgroundColor: colors.secondary,
                }}
              >
                <Text variant="bodyStrong">{item.question}</Text>
                {item.answers.length ? (
                  item.answers.map((answer) => (
                    <View key={answer.topic} style={{ gap: spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        {item.answers.length > 1 ? (
                          <Text variant="caption" style={{ fontWeight: '600' }}>
                            {LISTING_QUESTION_TOPIC_INFO[answer.topic].label}
                          </Text>
                        ) : null}
                        <Badge
                          label={LISTING_ANSWER_SOURCE_LABEL[answer.source]}
                          tone={SOURCE_TONE[answer.source]}
                        />
                      </View>
                      <Text variant="callout">{answer.text}</Text>
                      {answer.source !== 'not_stated' && answer.gaps.length ? (
                        <Text variant="caption" color="mutedForeground">
                          Not stated: {list(answer.gaps).toLowerCase()}.
                        </Text>
                      ) : null}
                      {answer.source === 'not_stated' || answer.gaps.length ? askButton : null}
                    </View>
                  ))
                ) : (
                  <View style={{ gap: spacing.xs }}>
                    <Badge
                      label={LISTING_ANSWER_SOURCE_LABEL.not_stated}
                      tone={SOURCE_TONE.not_stated}
                    />
                    <Text variant="callout">{UNMATCHED_ANSWER_TEXT}</Text>
                    {askButton}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}
