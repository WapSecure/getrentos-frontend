import { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LogIn, Mail, Phone, Send } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Chip,
  FormAlert,
  LinkButton,
  SectionHeader,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import {
  DEVELOPMENT_ENQUIRY_COPY as COPY,
  DEVELOPMENT_ENQUIRY_LIMITS as LIMITS,
  DEVELOPMENT_ENQUIRY_STATUS_LABEL,
  canAskAgain,
  enquiryMessageProblem,
  type BuyerDevelopmentEnquiry,
  type ShowroomDevelopment,
} from '@sureground/shared/showroom';
import { qk } from '@/lib/query/keys';
import { developmentsApi } from '@/lib/api/developments';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  ENQUIRY_STATUS_TONE,
  OPEN_LIMIT_REACHED,
  rememberAskIntent,
  sendProblem,
  unitTypeChoices,
} from '@/lib/askDeveloper';
import { DEVELOPER_QUESTIONS_ROUTE } from '@/lib/developerQuestions';
import { mailLink, telLink } from '@/lib/developments';
import { formatDate } from '@/lib/format';

/** Signed out: sign in, then come straight back to this development. */
export function signInToAsk(developmentId: string) {
  rememberAskIntent(developmentId);
  router.push('/(auth)/sign-in');
}

/**
 * "Ask the developer", as on the web: signed in only. The question and the answer are kept, so one
 * that goes unanswered can be followed up. Sureground takes no payment for a development.
 */
export function AskTheDeveloper({ development: d }: { development: ShowroomDevelopment }) {
  const { colors, spacing } = useTheme();
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={COPY.title} />
      <Text variant="callout" color="mutedForeground">
        {COPY.lead}
      </Text>
      <FormAlert tone="info" message={COPY.payment} />
      {signedIn ? (
        <SignedIn development={d} />
      ) : (
        <Button
          label={COPY.signedOut}
          icon={<LogIn size={16} color={colors.primaryForeground} />}
          onPress={() => signInToAsk(d.id)}
        />
      )}
    </View>
  );
}

function SignedIn({ development: d }: { development: ShowroomDevelopment }) {
  const { colors, spacing, radius } = useTheme();
  // As on the web: the list across developments lives in the buyer area.
  const isBuyer = useAuth().workspaces.includes('buyer');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [unitTypeId, setUnitTypeId] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const key = qk.market.developmentEnquiries(d.id);
  const mine = useQuery({ queryKey: key, queryFn: () => developmentsApi.myEnquiries(d.id) });
  const enquiries = mine.data ?? [];
  const allowed = canAskAgain(enquiries);
  const problem = enquiryMessageProblem(message);
  const choices = unitTypeChoices(d.unitTypes);

  const send = useMutation({
    mutationFn: () => developmentsApi.ask(d.id, message, unitTypeId),
    onSuccess: (sent) => {
      queryClient.setQueryData<BuyerDevelopmentEnquiry[]>(key, (old) => [sent, ...(old ?? [])]);
      void queryClient.invalidateQueries({ queryKey: qk.market.developmentEnquiryHistory });
      setMessage('');
      setUnitTypeId(undefined);
      setTouched(false);
      setSendError(null);
      toast.show(COPY.sent, 'success');
    },
    onError: (e) => setSendError(sendProblem(e)),
  });

  const onSend = () => {
    setTouched(true);
    setSendError(null);
    if (problem || !allowed || send.isPending) return;
    send.mutate();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {mine.isPending ? (
        <Skeleton height={120} radius={radius.lg} />
      ) : allowed ? (
        <Card style={{ gap: spacing.md }}>
          {choices.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="callout" color="mutedForeground">
                About which unit type
              </Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel="About which unit type"
                style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}
              >
                {choices.map((c) => (
                  <Chip
                    key={c.id ?? 'none'}
                    label={c.label}
                    size="sm"
                    selected={unitTypeId === c.id}
                    onPress={() => setUnitTypeId(c.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}
          <TextField
            label={`Your question for ${d.developerName}`}
            required
            multiline
            numberOfLines={4}
            maxLength={LIMITS.messageMax}
            showCount
            value={message}
            onChangeText={(t) => {
              setMessage(t);
              if (sendError) setSendError(null);
            }}
            onBlur={() => setTouched(true)}
            placeholder="For example: is the first instalment refundable if handover is late?"
            error={touched ? problem : undefined}
          />
          <FormAlert message={sendError} />
          <Button
            label="Send to the developer"
            loading={send.isPending}
            loadingLabel="Sending"
            icon={<Send size={16} color={colors.primaryForeground} />}
            onPress={onSend}
          />
        </Card>
      ) : (
        <FormAlert tone="warning" message={OPEN_LIMIT_REACHED} />
      )}

      {mine.isError ? (
        <Card style={{ gap: spacing.sm }}>
          <Text variant="callout" color="mutedForeground">
            We could not load your earlier questions.
          </Text>
          <Button
            label="Try again"
            variant="secondary"
            size="sm"
            style={{ alignSelf: 'flex-start' }}
            onPress={() => void mine.refetch()}
          />
        </Card>
      ) : null}

      {enquiries.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text variant="bodyStrong" accessibilityRole="header">
              {COPY.yours}
            </Text>
            {isBuyer ? (
              <LinkButton
                label={COPY.allYours}
                icon={<ArrowRight size={16} color={colors.primary} />}
                onPress={() => router.push(DEVELOPER_QUESTIONS_ROUTE as never)}
              />
            ) : null}
          </View>
          {enquiries.map((e) => (
            <Card key={e.id} style={{ gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <Text variant="caption" color="mutedForeground" style={{ flexShrink: 1 }}>
                  Sent {formatDate(e.createdAt)}
                  {e.unitTypeName ? ` · ${e.unitTypeName}` : ''}
                </Text>
                <Badge
                  label={DEVELOPMENT_ENQUIRY_STATUS_LABEL[e.status].buyer}
                  tone={ENQUIRY_STATUS_TONE[e.status]}
                />
              </View>
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
                    {e.development.developerName} answered
                    {e.answeredAt ? ` on ${formatDate(e.answeredAt)}` : ''}
                  </Text>
                  <Text variant="body">{e.answer}</Text>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The developer's own sales line and email, as they stated them: Sureground is not a party to the sale. */
export function SalesContact({ development: d }: { development: ShowroomDevelopment }) {
  const { colors, spacing } = useTheme();
  if (!d.salesPhone && !d.salesEmail) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Or contact their sales team</Text>
      {d.salesPhone ? (
        <Button
          label={d.salesPhone}
          variant="secondary"
          icon={<Phone size={16} color={colors.foreground} />}
          accessibilityLabel={`Call the developer on ${d.salesPhone}`}
          onPress={() => void Linking.openURL(telLink(d.salesPhone!)).catch(() => undefined)}
        />
      ) : null}
      {d.salesEmail ? (
        <Button
          label={d.salesEmail}
          variant="secondary"
          icon={<Mail size={16} color={colors.foreground} />}
          accessibilityLabel={`Email the developer at ${d.salesEmail}`}
          onPress={() => void Linking.openURL(mailLink(d.salesEmail!)).catch(() => undefined)}
        />
      ) : null}
    </View>
  );
}
