import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from '@sureground/icons/native';
import { Badge, Button, Card, Text, useTheme, type BadgeTone } from '@sureground/ui-native';
import type { AgentInspectionType, RoomCondition } from '@/lib/api/agent';
import { errorMessage } from '@/lib/api/client';
import {
  CHANGE_LABEL,
  inspectionDraftApi,
  type InspectionChange,
  type InspectionDraft,
} from '@/lib/api/inspectionDraft';

const CHANGE_TONE: Record<InspectionChange['kind'], BadgeTone> = {
  possible_damage: 'danger',
  wear_and_tear: 'neutral',
  unclear: 'warning',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function InspectionDraftPanel({
  taskId,
  type,
  rooms,
  photoCount,
  onApply,
}: {
  taskId: string;
  type: AgentInspectionType;
  rooms: { room: string; condition: RoomCondition; notes?: string }[];
  photoCount: number;
  onApply: (draft: InspectionDraft) => void;
}) {
  const { colors, spacing } = useTheme();
  const draft = useMutation({
    mutationFn: () =>
      inspectionDraftApi.draft(taskId, {
        type,
        rooms: rooms
          .filter((r) => r.room.trim())
          .map((r) => ({
            room: r.room.trim(),
            condition: r.condition,
            notes: r.notes || undefined,
          })),
      }),
  });
  const d = draft.data;

  return (
    <Card elevated>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Sparkles size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2}>
            Draft the report from photos
          </Text>
        </View>
        <Text variant="caption" color="mutedForeground">
          {photoCount === 0
            ? 'Add photos to your rooms first. Sureground suggests a condition and notes for each room you can edit.'
            : type === 'MOVE_OUT'
              ? 'Suggests each room’s condition and notes, and compares with the move-in report.'
              : 'Suggests each room’s condition and notes from your photos. You can edit everything.'}
        </Text>
        <Button
          label={d ? 'Draft again' : 'Draft the report'}
          variant={d ? 'secondary' : 'primary'}
          loading={draft.isPending}
          disabled={photoCount === 0}
          onPress={() => draft.mutate()}
        />
        {draft.isError ? (
          <Text variant="caption" color="destructive" accessibilityRole="alert">
            {errorMessage(draft.error, 'Could not draft the report.')}
          </Text>
        ) : null}

        {d ? (
          <View style={{ gap: spacing.md, marginTop: spacing.xs }}>
            {d.source === 'heuristic' ? (
              <Text variant="caption" color="mutedForeground">
                Reading photos is unavailable right now. Rate each room yourself
                {d.moveIn ? '; changes below come from the ratings.' : '.'}
              </Text>
            ) : null}

            {d.rooms.map((r) => (
              <View key={r.room} style={{ gap: 2 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    flexWrap: 'wrap',
                  }}
                >
                  <Text variant="bodyStrong">{r.room}</Text>
                  {r.condition ? (
                    <Badge label={cap(r.condition)} tone="info" />
                  ) : (
                    <Badge label="Photos unclear: rate it yourself" tone="warning" />
                  )}
                </View>
                <Text variant="caption">{r.notes}</Text>
              </View>
            ))}

            {d.roomsWithoutPhotos.length ? (
              <Text variant="caption" color="mutedForeground">
                No photos yet: {d.roomsWithoutPhotos.join(', ')}.
              </Text>
            ) : null}

            {d.rooms.length ? (
              <Button label="Use these suggestions" onPress={() => onApply(d)} />
            ) : null}

            {d.moveIn ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="bodyStrong" headingLevel={3}>
                  Changes since move-in ({d.moveIn.inspectedOn})
                </Text>
                {d.changes.length === 0 ? (
                  <Text variant="caption" color="mutedForeground">
                    Nothing looks different in the {d.moveIn.roomsCompared} rooms compared.
                  </Text>
                ) : (
                  d.changes.map((c, i) => (
                    <View
                      key={`${c.room}-${i}`}
                      style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}
                    >
                      <Badge label={CHANGE_LABEL[c.kind]} tone={CHANGE_TONE[c.kind]} />
                      <Text variant="caption" style={{ flex: 1 }}>
                        {c.room}: {c.detail}
                        {c.basis === 'recorded condition' ? ' (from the ratings)' : ''}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : type === 'MOVE_OUT' ? (
              <Text variant="caption" color="mutedForeground">
                No submitted move-in report for this property, so there is nothing to compare with.
              </Text>
            ) : null}

            <Text variant="caption" color="mutedForeground">
              {d.disclaimer}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
