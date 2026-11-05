import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ListChecks, Send } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Skeleton,
  Text,
  useTheme,
  type BadgeTone,
} from '@getrentos/ui-native';
import { apiFetch } from '@/lib/api/client';
import { REPLY_LANGUAGES, languageLabel, type ReplyLanguage } from '@/lib/replyLanguage';

type Stage = 'reminder' | 'instalments' | 'formal_demand';

interface DebtorPlan {
  ref: string;
  label: string;
  owed: string;
  charges: number;
  oldestDue: string;
  daysOverdue: number;
  paymentPattern: string;
  stage: Stage;
  reasons: string[];
  instalments: { amount: string; due: string }[] | null;
  nextNotice: string | null;
  message: string;
  messageLanguage?: ReplyLanguage;
  messageInEnglish?: string | null;
}

interface CollectionPlan {
  overview: string;
  debtors: DebtorPlan[];
  language?: ReplyLanguage;
  disclaimer: string;
}

const STAGE: Record<Stage, { label: string; tone: BadgeTone }> = {
  reminder: { label: 'Reminder', tone: 'neutral' },
  instalments: { label: 'Offer instalments', tone: 'info' },
  formal_demand: { label: 'Formal demand', tone: 'danger' },
};

/**
 * Collection plan on the phone: who first, which step, any instalment split,
 * and a message the person sends themselves through the share sheet.
 */
export function CollectionPlanCard({ path }: { path: string }) {
  const { colors, spacing, radius } = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  // The tenant's or household's language, for the messages; the plan itself stays in English.
  const [language, setLanguage] = useState<ReplyLanguage>('en');
  const q = useQuery({
    queryKey: ['collection-plan', path, language],
    queryFn: () =>
      apiFetch<CollectionPlan>(language === 'en' ? path : `${path}?language=${language}`),
    placeholderData: (previous) => previous,
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (q.isLoading) return <Skeleton height={120} radius={radius.md} />;
  const plan = q.data;
  if (!plan || plan.debtors.length === 0) return null;

  return (
    <Card elevated padding={spacing.lg}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <ListChecks size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2}>
            Collection plan
          </Text>
        </View>
        <Text variant="callout">{plan.overview}</Text>
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

        {plan.debtors.map((d, i) => {
          const isOpen = open === d.ref;
          return (
            <View
              key={d.ref}
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: spacing.sm,
                gap: spacing.xs,
              }}
            >
              <Pressable
                onPress={() => setOpen(isOpen ? null : d.ref)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${i + 1}. ${d.label}, ${d.owed}, ${d.daysOverdue} days, ${STAGE[d.stage].label}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={2}>
                    {i + 1}. {d.label}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {d.owed} · {d.daysOverdue} days
                  </Text>
                </View>
                <Badge label={STAGE[d.stage].label} tone={STAGE[d.stage].tone} />
                <ChevronDown
                  size={16}
                  color={colors.mutedForeground}
                  style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                />
              </Pressable>
              {isOpen ? (
                <View style={{ gap: spacing.xs }}>
                  <Text variant="caption" color="mutedForeground">
                    {d.charges} unpaid charge{d.charges === 1 ? '' : 's'}, oldest due {d.oldestDue}.{' '}
                    {d.paymentPattern}
                  </Text>
                  {d.reasons.map((r) => (
                    <Text key={r} variant="caption" color="mutedForeground">
                      {r}
                    </Text>
                  ))}
                  {d.instalments ? (
                    <Text variant="caption">
                      Instalments: {d.instalments.map((p) => `${p.amount} by ${p.due}`).join(', ')}
                    </Text>
                  ) : null}
                  {d.nextNotice ? <Text variant="caption">{d.nextNotice}</Text> : null}
                  <View
                    style={{
                      backgroundColor: colors.secondary,
                      borderRadius: radius.md,
                      padding: spacing.sm,
                      gap: spacing.xs,
                    }}
                  >
                    <Text variant="caption" style={{ fontWeight: '600' }}>
                      Message to send
                    </Text>
                    <Text variant="caption">{d.message}</Text>
                    {d.messageInEnglish ? (
                      <Text variant="caption" color="mutedForeground">
                        In English: {d.messageInEnglish}
                      </Text>
                    ) : plan.language && plan.language !== 'en' && d.messageLanguage === 'en' ? (
                      <Text variant="caption" color="mutedForeground">
                        Written in English: a {languageLabel(plan.language)} version is not
                        available for this one right now.
                      </Text>
                    ) : null}
                    <Button
                      label="Send…"
                      size="sm"
                      variant="secondary"
                      icon={<Send size={14} color={colors.foreground} />}
                      onPress={() => void Share.share({ message: d.message })}
                      accessibilityLabel={`Send the message to ${d.label}`}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
        <Text variant="caption" color="mutedForeground" style={{ fontSize: 11 }}>
          {plan.disclaimer}
        </Text>
      </View>
    </Card>
  );
}
