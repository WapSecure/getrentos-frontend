import { ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  FormAlert,
  QueryState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { messagingConsentApi, type MessagingConsent } from '@/lib/api/messagingConsent';
import { errorMessage } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * Consent to be texted (SMS and/or WhatsApp) for the few urgent things, to the
 * verified number on the profile. The same consent the web settings card and
 * Ask Sureground on WhatsApp read.
 */
export default function TextMessageSettings() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({ queryKey: qk.messagingConsent, queryFn: messagingConsentApi.get });
  const on = query.data && (query.data.sms || query.data.whatsapp);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Communication"
        title="Text messages"
        subtitle="SMS or WhatsApp for what you should not miss"
        onBack={() => goBack()}
        accessory={on ? <Badge label="On" tone="success" /> : null}
      />

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height={140} radius={radius.lg} />
            ))}
          </View>
        }
      >
        {query.data ? <ConsentForm consent={query.data} /> : null}
      </QueryState>
    </View>
  );
}

function ConsentForm({ consent: c }: { consent: MessagingConsent }) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const save = useMutation({
    mutationFn: messagingConsentApi.set,
    onSuccess: (data) => {
      qc.setQueryData(qk.messagingConsent, data);
      toast.show('Saved.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save that.'), 'error'),
  });

  const canOptIn = Boolean(c.phoneEnding && c.phoneVerified);
  const set = (key: 'sms' | 'whatsapp', value: boolean) =>
    save.mutate({ sms: c.sms, whatsapp: c.whatsapp, [key]: value });

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.success + '1f',
            }}
          >
            <MessageCircle size={19} color={colors.success} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="bodyStrong">For the few things you should not miss</Text>
            <Text variant="caption" color="mutedForeground">
              Rent due or overdue, deposit decisions, emergencies, a change to your payout account,
              or someone posing as your landlord. Off unless you turn it on. Quiet from 9pm to 7am
              except emergencies.
            </Text>
          </View>
        </View>
      </Card>

      {c.phoneEnding ? (
        <Text variant="caption" color="mutedForeground">
          To your number ending {c.phoneEnding}
          {c.phoneVerified ? '.' : ': verify it first.'}
        </Text>
      ) : (
        <Text variant="caption" color="mutedForeground">
          Add and verify a phone number first.
        </Text>
      )}

      {!canOptIn ? (
        <Button
          label="Verify your phone number"
          variant="secondary"
          onPress={() => router.push('/(app)/security-settings')}
        />
      ) : null}

      <FormAlert
        tone="warning"
        message={
          c.numberChanged
            ? 'Your number changed since you agreed, so texts have stopped. Turn them on again for this number.'
            : null
        }
      />

      <Card padding="none">
        <SwitchRow
          label="SMS"
          description="Plain text messages."
          value={c.sms}
          disabled={save.isPending || (!canOptIn && !c.sms)}
          onValueChange={(v) => set('sms', v)}
          style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
        />
        <Divider />
        <SwitchRow
          label="WhatsApp"
          description="Sent on WhatsApp instead of SMS when both are on."
          value={c.whatsapp}
          disabled={save.isPending || (!canOptIn && !c.whatsapp)}
          onValueChange={(v) => set('whatsapp', v)}
          style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
        />
      </Card>

      <FormAlert
        tone="info"
        title="Ask Sureground on WhatsApp"
        message={
          c.whatsapp && c.whatsappChatNumber
            ? `Message ${c.whatsappChatNumber} on WhatsApp from this number and say "hi". Ask about your rent, lease, repairs or listings in English, Pidgin, Yoruba, Hausa or Igbo. Answers come from your account; nothing is changed or paid on WhatsApp.`
            : null
        }
      />

      <Text variant="caption" color="mutedForeground">
        Our texts never contain links or bank details. If a text asks you to pay somewhere, it is
        not from us.
      </Text>
    </ScrollView>
  );
}
