import { ScrollView, View } from 'react-native';
import { Scale } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  FormAlert,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import type { RenewalAdvice } from '@/lib/api/renewalAdvice';
import { REPLY_LANGUAGES, type ReplyLanguage } from '@/lib/replyLanguage';

const OPTION_TITLE = { renew: 'Renew', relet: 'Re-let' } as const;

interface Props {
  advice: RenewalAdvice | undefined;
  isLoading: boolean;
  isFetching: boolean;
  language: ReplyLanguage;
  onLanguageChange: (language: ReplyLanguage) => void;
  onUse: (advice: RenewalAdvice) => void;
}

export function RenewalAdviceCard({
  advice,
  isLoading,
  isFetching,
  language,
  onLanguageChange,
  onUse,
}: Props) {
  const { colors, spacing, radius } = useTheme();
  if (isLoading) return <Skeleton height={140} radius={radius.md} />;
  if (!advice) return null;
  const f = advice.facts;

  return (
    <Card padding={spacing.md}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Scale size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={3}>
            Renew or re-let?
          </Text>
          <Text variant="caption" color="mutedForeground">
            Ends {f.lease.ends}
          </Text>
        </View>
        <Text variant="callout">{advice.summary}</Text>

        {f.options.map((o) => (
          <View
            key={o.key}
            style={{
              gap: 2,
              padding: spacing.sm,
              borderRadius: radius.sm,
              backgroundColor: colors.muted,
            }}
          >
            <Text variant="label">
              {OPTION_TITLE[o.key]} at {o.rentPerYear} a year: {o.firstYear} first year
            </Text>
            {o.basis.map((b) => (
              <Text key={b} variant="caption" color="mutedForeground">
                {b}
              </Text>
            ))}
          </View>
        ))}

        {[...f.record, ...(f.market ? [f.market] : [])].map((r) => (
          <Text key={r} variant="caption" color="mutedForeground">
            {r}
          </Text>
        ))}

        {f.increaseRule.noticePassed ? (
          <FormAlert
            tone="warning"
            message={`The ${f.increaseRule.noticeDays}-day notice for a rent increase ran out on ${f.increaseRule.sendBy}.`}
          />
        ) : (
          <Text variant="caption" color="mutedForeground">
            Send any rent change by {f.increaseRule.sendBy} ({f.increaseRule.noticeDays} days&apos;
            notice).
          </Text>
        )}
        {advice.pendingOffer ? (
          <FormAlert
            tone="info"
            message={`An offer of ${advice.pendingOffer.rentAmount} until ${advice.pendingOffer.leaseEnd} is waiting on the tenant. Sending a new one replaces it.`}
          />
        ) : null}

        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}
        >
          <Text variant="label">
            Suggested: {f.suggested.rent} {f.lease.period} until {f.suggested.newEnd}
          </Text>
          <Badge
            label={
              f.suggested.increasePercent > 0 ? `+${f.suggested.increasePercent}%` : 'Same rent'
            }
            tone={f.suggested.increasePercent > 0 ? 'info' : 'neutral'}
          />
        </View>
        <Text variant="caption" color="mutedForeground">
          {f.suggested.reason}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}
          accessibilityLabel="Language for the note"
        >
          <Text variant="caption" color="mutedForeground">
            {isFetching ? 'Writing…' : 'Note in'}
          </Text>
          {REPLY_LANGUAGES.map((l) => (
            <Chip
              key={l.value}
              size="sm"
              label={l.label}
              selected={language === l.value}
              onPress={() => onLanguageChange(l.value)}
            />
          ))}
        </ScrollView>
        <Button
          label="Use this offer"
          size="sm"
          variant="secondary"
          onPress={() => onUse(advice)}
        />
        <Text variant="caption" color="mutedForeground">
          {advice.disclaimer}
        </Text>
      </View>
    </Card>
  );
}
