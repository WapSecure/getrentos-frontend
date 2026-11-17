import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, Clock, ShieldAlert } from '@sureground/icons/native';
import { Card, Text, useTheme } from '@sureground/ui-native';
import { kycApi, type KycStatus } from '@/lib/api/kyc';

type StepState = 'done' | 'pending' | 'rejected' | 'todo';

interface Step {
  key: string;
  label: string;
  state: StepState;
  todo: string;
  href: string;
}

const STATE_TEXT: Record<StepState, string> = {
  done: 'Done',
  pending: 'In review',
  rejected: 'Needs another look',
  todo: '',
};

function kycState(status: KycStatus | undefined): StepState {
  if (status === 'APPROVED') return 'done';
  if (status === 'PENDING_REVIEW') return 'pending';
  if (status === 'REJECTED' || status === 'NEEDS_CLARIFICATION') return 'rejected';
  return 'todo';
}

/** Identity and licence as one checklist, so a new professional sees what is left instead of two cards that both "unlock" the same things. */
export function ProfessionalSetupCard({ unlocks }: { unlocks: string }) {
  const { colors, spacing } = useTheme();
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  if (!kyc.data) return null;

  const identityDone = kyc.data.identityVerified ?? kyc.data.identity?.status === 'APPROVED';
  const steps: Step[] = [
    {
      key: 'identity',
      label: 'Verify your identity',
      state: identityDone ? 'done' : kycState(kyc.data.identity?.status),
      todo: 'Takes two minutes',
      href: '/(app)/verify-identity',
    },
    {
      key: 'licence',
      label: 'Licence check',
      state: kycState(kyc.data.license?.status),
      todo: 'Add your licence',
      href: '/(app)/license-verification',
    },
  ];
  const done = steps.filter((s) => s.state === 'done').length;
  if (done === steps.length) return null;

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">Get set up to take clients</Text>
        <Text variant="caption" color="mutedForeground">
          {`${done} of ${steps.length} done. Finishing both unlocks ${unlocks}.`}
        </Text>
      </View>
      {steps.map((step) => {
        const Icon =
          step.state === 'done' ? CheckCircle2 : step.state === 'pending' ? Clock : ShieldAlert;
        const tint =
          step.state === 'done'
            ? colors.success
            : step.state === 'rejected'
              ? colors.destructive
              : step.state === 'pending'
                ? colors.primary
                : colors.warning;
        return (
          <Pressable
            key={step.key}
            onPress={() => router.push(step.href as never)}
            disabled={step.state === 'done'}
            accessibilityRole="button"
            accessibilityLabel={`${step.label}: ${STATE_TEXT[step.state] || step.todo}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 }}
          >
            <Icon size={18} color={tint} />
            <View style={{ flex: 1 }}>
              <Text variant="callout">{step.label}</Text>
              <Text variant="caption" color="mutedForeground">
                {STATE_TEXT[step.state] || step.todo}
              </Text>
            </View>
            {step.state === 'done' ? null : (
              <ChevronRight size={16} color={colors.mutedForeground} />
            )}
          </Pressable>
        );
      })}
    </Card>
  );
}
