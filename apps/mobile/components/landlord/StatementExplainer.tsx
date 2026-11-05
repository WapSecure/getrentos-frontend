import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bell, Clock } from 'lucide-react-native';
import { Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { apiFetch } from '@/lib/api/client';

interface StatementExplanation {
  headline: string;
  points: string[];
  questions: string[];
  flags: { code: string; severity: 'urgent' | 'soon' | 'info'; detail: string }[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

/** A statement in plain words, shown inside its card when the landlord asks for it. */
export function StatementExplainer({ statementId }: { statementId: string }) {
  const { colors, spacing, radius } = useTheme();
  const q = useQuery({
    queryKey: ['landlord', 'owner-statements', statementId, 'explain'],
    queryFn: () =>
      apiFetch<StatementExplanation>(`/landlord/owner-statements/${statementId}/explain`),
    staleTime: 10 * 60_000,
    retry: false,
  });
  if (q.isLoading) return <Skeleton height={90} radius={radius.md} />;
  if (q.isError || !q.data) {
    return (
      <Text variant="caption" color="mutedForeground">
        Could not explain this statement right now.
      </Text>
    );
  }
  const d = q.data;
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
          <Text variant="caption" style={{ fontWeight: '600' }}>
            Worth asking your manager
          </Text>
          {d.questions.map((x) => (
            <Text key={x} variant="caption" color="mutedForeground">
              • {x}
            </Text>
          ))}
        </View>
      ) : null}
      <Text variant="caption" color="mutedForeground" style={{ fontSize: 11 }}>
        {d.disclaimer}
      </Text>
    </View>
  );
}
