import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, Clock, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { Card, Divider, Text, useTheme } from '@getrentos/ui-native';
import { HelpFeedbackCard } from '@/components/help/HelpFeedbackCard';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { SUPPORT, telUrl } from '@/lib/support';


const FAQS: { question: string; answer: string }[] = [
  {
    question: 'How does GetRentos verify identities and properties?',
    answer:
      'Every user completes BVN/NIN identity verification, and every listed property is checked against title deeds or certificates of occupancy before it can go live. Look for the green "Verified" badge.',
  },
  {
    question: 'How are payments protected?',
    answer:
      'GetRentos Payment Protection holds your payment for a short period before it is released to the other side. If something is wrong, raise a dispute and the money stays held until it is resolved, so money never changes hands without a paper trail.',
  },
  {
    question: 'How do I contact someone about my account?',
    answer:
      'Use the contact options below, or message your assigned account contact directly from the Messages tab.',
  },
  {
    question: 'Where can I see the status of an ongoing request?',
    answer:
      'Any pending applications, disputes, or verifications you have open will show live status updates on your dashboard.',
  },
];

/** Shared help centre. Pass `?messages=<route>` to point the "Message us" row at the caller's inbox. */
export default function HelpCenter() {
  const { messages } = useLocalSearchParams<{ messages?: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Help centre"
        title="Help"
        subtitle="Answers and ways to reach the GetRentos team"
        onBack={() => goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <View style={{ gap: spacing.sm }}>
          <Text variant="heading">Frequently asked</Text>
          <Card elevated padding="none">
            {FAQS.map((faq, i) => {
              const expanded = openIndex === i;
              return (
                <View key={faq.question}>
                  {i > 0 ? <Divider /> : null}
                  <Pressable
                    onPress={() => setOpenIndex(expanded ? null : i)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    style={{ padding: spacing.lg, gap: spacing.sm }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="bodyStrong" style={{ flex: 1 }}>
                        {faq.question}
                      </Text>
                      {expanded ? (
                        <ChevronUp size={17} color={colors.mutedForeground} />
                      ) : (
                        <ChevronDown size={17} color={colors.mutedForeground} />
                      )}
                    </View>
                    {expanded ? (
                      <Text variant="callout" color="mutedForeground">
                        {faq.answer}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="heading">Contact support</Text>
          <Card elevated padding="none">
            <ContactRow
              icon={<Mail size={18} color={colors.primary} />}
              label="Email"
              value={SUPPORT.email}
              onPress={() => Linking.openURL(`mailto:${SUPPORT.email}`)}
            />
            {SUPPORT.phone ? (
              <>
                <Divider />
                <ContactRow
                  icon={<Phone size={18} color={colors.primary} />}
                  label="Phone"
                  value={SUPPORT.phone}
                  onPress={() => Linking.openURL(telUrl(SUPPORT.phone))}
                />
              </>
            ) : null}
            {messages ? (
              <>
                <Divider />
                <ContactRow
                  icon={<MessageCircle size={18} color={colors.primary} />}
                  label="Message us"
                  value="Open your inbox"
                  onPress={() => router.push(messages as never)}
                />
              </>
            ) : null}
            {SUPPORT.hours ? (
              <>
                <Divider />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.lg,
                  }}
                >
                  <Clock size={18} color={colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">Hours</Text>
                    <Text variant="caption" color="mutedForeground">
                      {SUPPORT.hours}
                    </Text>
                  </View>
                </View>
              </>
            ) : null}
          </Card>
        </View>

        <View
          style={{
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.accent,
          }}
        >
          <Text variant="callout" color="mutedForeground">
            In an emergency affecting safety or property, call your local emergency services first,
            then let us know through any of the channels above.
          </Text>
        </View>

        <HelpFeedbackCard />
      </ScrollView>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {value}
        </Text>
      </View>
    </Pressable>
  );
}
