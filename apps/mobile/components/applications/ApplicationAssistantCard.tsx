import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, BadgeCheck } from '@sureground/icons/native';
import { Card, Skeleton, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { applicationAssistantApi, type AssistantStep } from '@/lib/api/applicationAssistant';
import { profileApi } from '@/lib/api/profile';
import { applicationSteps, applicationTip, type IdentityState } from '@/lib/applicationTip';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';

export function ApplicationAssistantCard() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({
    queryKey: qk.renter.applicationAssistant,
    queryFn: applicationAssistantApi.get,
  });

  const profile = useQuery({ queryKey: qk.renter.profile, queryFn: profileApi.get });
  const identity = useIdentityVerification();

  if (query.isLoading) return <Skeleton height={160} radius={radius.xl} />;
  if (!query.data) return null;

  // The tip is built here from the renter's own contact details and checks, so it only asks for
  // what applies to them (a phone-only renter is never sent to verify an email).
  const identityState: IdentityState = !identity.known
    ? 'unknown'
    : identity.verified
      ? 'verified'
      : identity.inReview
        ? 'in_review'
        : 'not_verified';
  const input = {
    steps: query.data.steps,
    phone: profile.data?.phone,
    phoneVerified: profile.data?.phoneVerified,
    identity: profile.data ? identityState : ('unknown' as const),
  };
  const steps = applicationSteps(input);
  const suggestion = profile.data ? applicationTip(input) : null;
  const done = steps.filter((s) => s.status === 'completed').length;

  return (
    <Card elevated>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <BadgeCheck size={17} color={colors.primary} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          Get application-ready
        </Text>
        <Text variant="caption" color="mutedForeground">
          {done}/{steps.length}
        </Text>
      </View>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {steps.map((s) => (
          <StepRow key={s.key} step={s} />
        ))}
      </View>

      {suggestion ? (
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.md }}>
          {suggestion}
        </Text>
      ) : null}
    </Card>
  );
}

function StepRow({ step }: { step: AssistantStep }) {
  const { colors } = useTheme();
  const done = step.status === 'completed';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {done ? (
        <Check size={15} color={colors.success} />
      ) : (
        <Circle
          size={15}
          color={step.status === 'in_progress' ? colors.primary : colors.mutedForeground}
        />
      )}
      <Text
        variant="callout"
        color={done ? 'mutedForeground' : 'foreground'}
        style={done ? { textDecorationLine: 'line-through' } : undefined}
      >
        {step.title}
      </Text>
    </View>
  );
}
