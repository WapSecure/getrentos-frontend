import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react-native';
import { LinkButton, Skeleton, Text, useTheme } from '@sureground/ui-native';
import { landlordApi } from '@/lib/api/landlord';

// It never ranks or recommends: the decision stays with the landlord.
export function ApplicantSummaryPanel({ applicationId }: { applicationId: string }) {
  const { colors, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ['landlord', 'applications', applicationId, 'summary'],
    queryFn: () => landlordApi.applicantSummary(applicationId),
    enabled: open,
    staleTime: 10 * 60_000,
  });
  const s = query.data;

  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
      >
        <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
          Summary of the facts
        </Text>
        <ChevronDown
          size={13}
          color={colors.primary}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {!open ? null : query.isLoading ? (
        <Skeleton height={64} />
      ) : query.isError && !s ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground">
            This did not load.
          </Text>
          <LinkButton label="Try again" onPress={() => void query.refetch()} />
        </View>
      ) : s ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="caption">{s.summary}</Text>
          {s.questions.length ? (
            <View style={{ gap: 2 }}>
              <Text variant="label">Questions to ask</Text>
              {s.questions.map((q) => (
                <Text key={q} variant="caption" color="mutedForeground">
                  • {q}
                </Text>
              ))}
            </View>
          ) : null}
          {s.checks.length ? (
            <View style={{ gap: 2 }}>
              <Text variant="label">Before you decide</Text>
              {s.checks.map((c) => (
                <Text key={c} variant="caption" color="mutedForeground">
                  • {c}
                </Text>
              ))}
            </View>
          ) : null}
          <Text variant="caption" color="mutedForeground">
            {s.disclaimer}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
