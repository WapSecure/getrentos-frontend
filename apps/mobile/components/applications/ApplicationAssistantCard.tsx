import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, Sparkles } from 'lucide-react-native';
import { Card, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { applicationAssistantApi, type AssistantStep } from '@/lib/api/applicationAssistant';

export function ApplicationAssistantCard() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.renter.applicationAssistant,
    queryFn: applicationAssistantApi.get,
  });

  if (query.isLoading) return <Skeleton height={160} radius={16} />;
  if (!query.data) return null;

  const { steps, suggestion } = query.data;
  const done = steps.filter((s) => s.status === 'completed').length;

  return (
    <Card elevated>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Sparkles size={17} color={colors.primary} />
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
