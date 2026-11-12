import { View } from 'react-native';
import { AlertTriangle, CheckCircle2, CircleDashed } from '@sureground/icons/native';
import { Badge, Card, FormAlert, Text, useTheme } from '@sureground/ui-native';
import { PERFECTION_OWNER, PERFECTION_STEP, type Perfection } from '@/lib/api/landSales';
import { formatDate } from '@/lib/format';

/** Consent and registration with the state, step by step, with who is responsible for each. */
export function TitlePerfection({ perfection: t }: { perfection: Perfection }) {
  const { colors, spacing } = useTheme();
  const overall =
    t.status === 'PERFECTED'
      ? { label: 'Title perfected', tone: 'success' as const }
      : t.status === 'EXCEPTION'
        ? { label: 'Needs attention', tone: 'danger' as const }
        : { label: 'In progress', tone: 'info' as const };
  return (
    <Card style={{ gap: spacing.md }}>
      <Badge label={overall.label} tone={overall.tone} />
      <Text variant="caption" color="mutedForeground">
        {t.professionalName
          ? `Accountable professional: ${t.professionalName}${t.professionalFirm ? `, ${t.professionalFirm}` : ''}`
          : 'Accountable professional not yet named'}
      </Text>
      {t.status === 'PERFECTED' ? (
        <FormAlert
          tone="success"
          message={`Registered in your name${t.perfectedAt ? ` on ${formatDate(t.perfectedAt)}` : ''}: ${t.finalInstrumentReference ?? ''}`}
        />
      ) : null}
      {t.steps.map((step) => {
        const done = step.status === 'APPROVED' || step.status === 'NOT_APPLICABLE';
        const Icon = done ? CheckCircle2 : step.escalationLevel > 0 ? AlertTriangle : CircleDashed;
        return (
          <View key={step.key} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Icon
              size={16}
              color={
                done
                  ? colors.success
                  : step.escalationLevel > 0
                    ? colors.warning
                    : colors.mutedForeground
              }
              style={{ marginTop: 3 }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {step.label}
              </Text>
              <Badge
                label={PERFECTION_STEP[step.status].label}
                tone={PERFECTION_STEP[step.status].tone}
              />
              <Text variant="caption" color="mutedForeground">
                {[
                  PERFECTION_OWNER[step.owner] ?? step.owner,
                  !done && step.dueDate ? `due ${formatDate(step.dueDate, 'short')}` : null,
                  step.escalationLevel > 0 && !done ? 'late' : null,
                  step.submittedAt ? `submitted ${formatDate(step.submittedAt, 'short')}` : null,
                  step.approvedAt ? `approved ${formatDate(step.approvedAt, 'short')}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </View>
        );
      })}
      {t.status !== 'PERFECTED' && (t.blockers?.length ?? 0) > 0 ? (
        <Text variant="caption" color="mutedForeground">
          Still to do: {t.blockers!.join('; ')}
        </Text>
      ) : null}
      <Text variant="caption" color="mutedForeground">
        A step submitted to a government office is not approved until the approval is recorded. Your
        title is perfected only when every step is approved and the final registered instrument is
        on file.
      </Text>
    </Card>
  );
}
