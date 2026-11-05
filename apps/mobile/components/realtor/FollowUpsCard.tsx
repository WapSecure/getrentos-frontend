import { useState } from 'react';
import { Linking, ScrollView, Share, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Share2 } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  Skeleton,
  Text,
  useTheme,
  useToast,
  type BadgeTone,
} from '@getrentos/ui-native';
import { errorMessage } from '@/lib/api/client';
import { followUpsApi, type FollowUp, type FollowUpStep } from '@/lib/api/followUps';
import { whatsappLink } from '@/lib/api/realtor';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';
import { REPLY_LANGUAGES, type ReplyLanguage } from '@/lib/replyLanguage';

const STEP: Record<FollowUpStep, { label: string; tone: BadgeTone }> = {
  confirm_viewing: { label: 'Confirm viewing', tone: 'info' },
  first_contact: { label: 'First reply', tone: 'warning' },
  after_viewing: { label: 'After viewing', tone: 'info' },
  listing_gone: { label: 'Home gone', tone: 'warning' },
  offer_viewing: { label: 'Offer a viewing', tone: 'neutral' },
  check_in: { label: 'Check in', tone: 'neutral' },
  last_try: { label: 'Last try', tone: 'neutral' },
};

const FIRST = 3;

/**
 * "Follow up today" on the phone: leads due a nudge, each with the reason and
 * a drafted message to send on WhatsApp or share, then mark contacted.
 * Hidden when nothing is due or if it fails.
 */
export function FollowUpsCard() {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [language, setLanguage] = useState<ReplyLanguage>('en');
  const [showAll, setShowAll] = useState(false);
  const q = useQuery({
    queryKey: qk.realtor.followUps(language),
    queryFn: () => followUpsApi.plan(language),
    placeholderData: (previous) => previous,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const contacted = useMutation({
    mutationFn: (leadId: string) => followUpsApi.markContacted(leadId),
    onSuccess: () => {
      void haptics.success();
      toast.show('Marked contacted.', 'success');
      void qc.invalidateQueries({ queryKey: ['realtor', 'leads'] });
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not mark that lead contacted.'), 'error'),
  });

  if (q.isLoading) return <Skeleton height={120} radius={radius.md} />;
  const plan = q.data;
  if (!plan || plan.followUps.length === 0) return null;
  const shown = showAll ? plan.followUps : plan.followUps.slice(0, FIRST);

  const openWhatsApp = (f: FollowUp, link: string) =>
    Linking.openURL(`${link}?text=${encodeURIComponent(f.message)}`).catch(() =>
      toast.show('WhatsApp did not open. Share the message instead.', 'error')
    );

  return (
    <Card elevated padding={spacing.lg}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Send size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2}>
            Follow up today
          </Text>
          <Badge label={String(plan.followUps.length)} />
        </View>
        <Text variant="callout">
          {plan.overview}
          {plan.onTrack > 0
            ? ` ${plan.onTrack} other open lead${plan.onTrack === 1 ? ' is' : 's are'} on track.`
            : ''}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}
          accessibilityLabel="Language for the messages"
        >
          <Text variant="caption" color="mutedForeground">
            {q.isFetching ? 'Writing messages…' : 'Messages in'}
          </Text>
          {REPLY_LANGUAGES.map((l) => (
            <Chip
              key={l.value}
              size="sm"
              label={l.label}
              selected={language === l.value}
              onPress={() => setLanguage(l.value)}
            />
          ))}
        </ScrollView>

        {shown.map((f, i) => {
          const wa = whatsappLink(f.phone);
          return (
            <View key={f.leadId} style={{ gap: spacing.xs }}>
              {i > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  flexWrap: 'wrap',
                }}
              >
                <Text variant="label">{f.name}</Text>
                <Badge label={STEP[f.step].label} tone={STEP[f.step].tone} />
              </View>
              <Text variant="caption" color="mutedForeground">
                {f.why}
              </Text>
              <View
                style={{
                  padding: spacing.sm,
                  borderRadius: radius.sm,
                  backgroundColor: colors.muted,
                }}
              >
                <Text variant="callout">{f.message}</Text>
                {f.messageInEnglish ? (
                  <Text variant="caption" color="mutedForeground">
                    In English: {f.messageInEnglish}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
                {wa ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    label="WhatsApp"
                    icon={<MessageCircle size={14} color={colors.foreground} />}
                    onPress={() => void openWhatsApp(f, wa)}
                  />
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  label="Share"
                  icon={<Share2 size={14} color={colors.foreground} />}
                  onPress={() => void Share.share({ message: f.message })}
                />
                <Button
                  size="sm"
                  label="Mark contacted"
                  loading={contacted.isPending && contacted.variables === f.leadId}
                  onPress={() => contacted.mutate(f.leadId)}
                />
              </View>
            </View>
          );
        })}

        {plan.followUps.length > FIRST ? (
          <Button
            size="sm"
            variant="ghost"
            label={showAll ? 'Show fewer' : `Show all ${plan.followUps.length}`}
            onPress={() => setShowAll((v) => !v)}
          />
        ) : null}
        <Text variant="caption" color="mutedForeground">
          {plan.disclaimer}
        </Text>
      </View>
    </Card>
  );
}
