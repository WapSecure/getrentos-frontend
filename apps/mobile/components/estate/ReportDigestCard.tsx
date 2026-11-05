import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Layers, Megaphone } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  Skeleton,
  Text,
  useTheme,
  type BadgeTone,
} from '@getrentos/ui-native';
import { estateManagerApi, type ReportGroup } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';
import { AnnouncementSheet } from './EstateUI';

const PRIORITY: Record<string, BadgeTone> = {
  CRITICAL: 'danger',
  URGENT: 'danger',
  HIGH: 'warning',
};

/**
 * "Shared problems" on the phone: open reports that describe the same thing,
 * with how many households and a next step, and a way to draft an update for
 * residents. Hidden when nothing groups, or if it fails.
 */
export function ReportDigestCard({ estateId }: { estateId: string }) {
  const { colors, spacing, radius } = useTheme();
  const [notes, setNotes] = useState<string | null>(null);
  const q = useQuery({
    queryKey: qk.estateManager.reportDigest(estateId),
    queryFn: () => estateManagerApi.reportDigest(estateId),
    enabled: !!estateId,
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (q.isLoading) return <Skeleton height={110} radius={radius.md} />;
  const d = q.data;
  if (!d || d.groups.length === 0) return null;
  // Only what residents reported goes into the notes, never the suggested step.
  const notesFor = (g: ReportGroup) => `${g.title}. ${g.summary}`;

  return (
    <>
      <Card elevated padding={spacing.lg}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Layers size={18} color={colors.primary} />
            <Text variant="bodyStrong" headingLevel={2}>
              Shared problems
            </Text>
          </View>
          <Text variant="callout">{d.overview}</Text>
          {d.groups.map((g, i) => (
            <View key={g.title} style={{ gap: spacing.xs }}>
              {i > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  flexWrap: 'wrap',
                }}
              >
                <Text variant="label">{g.title}</Text>
                <Badge label={g.priority.toLowerCase()} tone={PRIORITY[g.priority] ?? 'neutral'} />
              </View>
              <Text variant="caption" color="mutedForeground">
                {g.line}
              </Text>
              <Text variant="callout">{g.summary}</Text>
              <Text variant="caption" color="mutedForeground">
                Next step: {g.action}
              </Text>
              <Button
                label="Draft an update"
                size="sm"
                variant="secondary"
                icon={<Megaphone size={14} color={colors.foreground} />}
                onPress={() => setNotes(notesFor(g))}
              />
            </View>
          ))}
          <Text variant="caption" color="mutedForeground">
            {d.disclaimer}
          </Text>
        </View>
      </Card>
      <AnnouncementSheet
        key={notes ?? 'none'}
        open={notes !== null}
        onClose={() => setNotes(null)}
        estateId={estateId}
        initialNotes={notes ?? ''}
      />
    </>
  );
}
