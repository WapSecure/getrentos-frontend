import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { Button, Card, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agentApi,
  type AgentInspectionRoom,
  type AgentInspectionType,
  type RoomCondition,
} from '@/lib/api/agent';
import { ApiError } from '@/lib/api/client';

const TYPES: { value: AgentInspectionType; label: string }[] = [
  { value: 'MOVE_IN', label: 'Move-in' },
  { value: 'MOVE_OUT', label: 'Move-out' },
  { value: 'PERIODIC', label: 'Periodic' },
  { value: 'OTHER', label: 'Other' },
];

const CONDITIONS: { value: RoomCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const ROOM_PRESETS = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'];

interface RoomDraft extends AgentInspectionRoom {
  key: number;
}

export default function SubmitInspection() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [type, setType] = useState<AgentInspectionType>('MOVE_IN');
  const [clientName, setClientName] = useState('');
  const [overallCondition, setOverallCondition] = useState('');
  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const nextRoomKey = useRef(0);

  const addRoom = (name: string) => {
    const key = nextRoomKey.current++;
    setRooms((prev) => [...prev, { key, room: name, condition: 'good', notes: '', photoCount: 0 }]);
  };

  const updateRoom = (key: number, patch: Partial<RoomDraft>) => {
    setRooms((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRoom = (key: number) => {
    setRooms((prev) => prev.filter((r) => r.key !== key));
  };

  const mutation = useMutation({
    mutationFn: () =>
      agentApi.submitInspection({
        taskId,
        scheduledAt: new Date().toISOString(),
        type,
        clientName: clientName.trim() || undefined,
        overallCondition: overallCondition.trim() || undefined,
        rooms: rooms.map(({ key: _key, ...r }) => ({
          room: r.room,
          condition: r.condition,
          notes: r.notes?.trim() || undefined,
          photoCount: r.photoCount,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'tasks'] });
      qc.invalidateQueries({ queryKey: qk.agent.dashboard });
      qc.invalidateQueries({ queryKey: ['agent', 'inspections'] });
      qc.invalidateQueries({ queryKey: qk.agent.sync });
      toast.show('Inspection submitted.', 'success');
      router.back();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not submit this inspection.',
        'error'
      ),
  });

  const canSubmit = rooms.length > 0 && rooms.every((r) => r.room.trim().length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Submit inspection</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                selected={type === t.value}
                onPress={() => setType(t.value)}
              />
            ))}
          </View>
        </View>

        <TextField label="Client name (optional)" value={clientName} onChangeText={setClientName} />

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Rooms</Text>
          {rooms.length === 0 ? (
            <Text variant="caption" color="mutedForeground">
              Add at least one room to submit.
            </Text>
          ) : null}
          {rooms.map((room) => (
            <Card key={room.key} elevated>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Room"
                    value={room.room}
                    onChangeText={(v) => updateRoom(room.key, { room: v })}
                  />
                </View>
                <Pressable
                  onPress={() => removeRoom(room.key)}
                  hitSlop={8}
                  style={{ paddingBottom: 12 }}
                >
                  <Trash2 size={18} color={colors.destructive} />
                </Pressable>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.xs,
                  marginTop: spacing.sm,
                }}
              >
                {CONDITIONS.map((c) => (
                  <Chip
                    key={c.value}
                    label={c.label}
                    size="sm"
                    selected={room.condition === c.value}
                    onPress={() => updateRoom(room.key, { condition: c.value })}
                  />
                ))}
              </View>

              <View style={{ marginTop: spacing.sm }}>
                <TextField
                  label="Notes (optional)"
                  placeholder="e.g. Minor scuff on wall"
                  value={room.notes}
                  onChangeText={(v) => updateRoom(room.key, { notes: v })}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: spacing.sm,
                }}
              >
                <Text variant="caption" color="mutedForeground">
                  Photos taken
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Pressable
                    onPress={() =>
                      updateRoom(room.key, { photoCount: Math.max(0, (room.photoCount ?? 0) - 1) })
                    }
                    hitSlop={8}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Minus size={14} color={colors.foreground} />
                  </Pressable>
                  <Text variant="callout" style={{ minWidth: 20, textAlign: 'center' }}>
                    {room.photoCount ?? 0}
                  </Text>
                  <Pressable
                    onPress={() => updateRoom(room.key, { photoCount: (room.photoCount ?? 0) + 1 })}
                    hitSlop={8}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={14} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {ROOM_PRESETS.map((name) => (
              <Chip key={name} label={`+ ${name}`} onPress={() => addRoom(name)} size="sm" />
            ))}
            <Chip label="+ Custom room" onPress={() => addRoom('')} size="sm" />
          </View>
        </View>

        <TextField
          label="Overall condition (optional)"
          placeholder="Summarize the property's condition"
          multiline
          numberOfLines={3}
          value={overallCondition}
          onChangeText={setOverallCondition}
        />

        <Button
          label="Submit inspection"
          loading={mutation.isPending}
          disabled={!canSubmit}
          onPress={() => mutation.mutate()}
        />
      </ScrollView>
    </View>
  );
}
