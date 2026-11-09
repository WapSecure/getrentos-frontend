import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bell, Clock } from 'lucide-react-native';
import { QueryState, Skeleton, Text, useTheme } from '@sureground/ui-native';
import type { StatementExplanation } from '@/lib/api/landlord';
import { landlordApi } from '@/lib/api/landlord';
import { qk } from '@/lib/query/keys';

/** A statement in plain words, shown inside its card when the landlord asks for it. */
export function StatementExplainer({ statementId }: { statementId: string }) {
  const { radius } = useTheme();
  const q = useQuery({
    queryKey: qk.landlord.statementExplanation(statementId),
    queryFn: () => landlordApi.explainOwnerStatement(statementId),
    staleTime: 10 * 60_000,
    retry: false,
  });
  // The landlord asked for this, so a failure shows with a retry rather than vanishing.
  return (
    <QueryState
      query={q}
      skeleton={<Skeleton height={90} radius={radius.md} />}
      errorTitle="Could not explain this statement"
    >
      {q.data ? <Explanation d={q.data} /> : null}
    </QueryState>
  );
}

function Explanation({ d }: { d: StatementExplanation }) {
  const { colors, spacing } = useTheme();
  const tone = {
    urgent: { Icon: AlertCircle, color: colors.destructive },
    soon: { Icon: Clock, color: colors.warning },
    info: { Icon: Bell, color: colors.mutedForeground },
  } as const;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout">{d.headline}</Text>
      {d.flags.map((f) => {
        const { Icon, color } = tone[f.severity];
        return (
          <View key={f.code} style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Icon size={14} color={color} style={{ marginTop: 2 }} />
            <Text variant="caption" style={{ flex: 1 }}>
              {f.detail}
            </Text>
          </View>
        );
      })}
      {d.points.map((p) => (
        <Text key={p} variant="caption" color="mutedForeground">
          • {p}
        </Text>
      ))}
      {d.questions.length ? (
        <View style={{ gap: 2 }}>
          <Text variant="label">Worth asking your manager</Text>
          {d.questions.map((x) => (
            <Text key={x} variant="caption" color="mutedForeground">
              • {x}
            </Text>
          ))}
        </View>
      ) : null}
      <Text variant="caption" color="mutedForeground">
        {d.disclaimer}
      </Text>
    </View>
  );
}
