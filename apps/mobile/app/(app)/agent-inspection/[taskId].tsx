import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ChevronLeft, ImagePlus, Trash2, X } from 'lucide-react-native';
import { Button, Card, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agentApi,
  type AgentInspectionPhoto,
  type AgentInspectionRoom,
  type AgentInspectionType,
  type RoomCondition,
} from '@/lib/api/agent';
import { ApiError } from '@/lib/api/client';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';

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
  const [photos, setPhotos] = useState<AgentInspectionPhoto[]>([]);
  const [uploadingKey, setUploadingKey] = useState<number | null>(null);
  const nextRoomKey = useRef(0);

  const addPhoto = async (room: RoomDraft, source: 'camera' | 'library') => {
    if (!room.room.trim()) {
      toast.show('Name the room before adding its photos.', 'error');
      return;
    }
    const file = await (source === 'camera' ? capturePhoto() : pickPhoto());
    if (!file) return;
    setUploadingKey(room.key);
    try {
      const photo = await agentApi.addInspectionPhoto(taskId, file, room.room.trim());
      setPhotos((prev) => [...prev, photo]);
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Could not upload that photo.', 'error');
    } finally {
      setUploadingKey(null);
    }
  };

  const removePhoto = async (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    try {
      await agentApi.removeInspectionPhoto(photoId);
    } catch {
      /* best effort — already removed from view */
    }
  };

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
          photoCount: photos.filter((p) => p.room === r.room.trim()).length,
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

              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                <Text variant="caption" color="mutedForeground">
                  Evidence photos
                </Text>
                {(() => {
                  const roomPhotos = photos.filter(
                    (p) => p.room === room.room.trim() && room.room.trim()
                  );
                  return roomPhotos.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      {roomPhotos.map((photo) => (
                        <View key={photo.id} style={{ width: 64, height: 64 }}>
                          <Image
                            source={{ uri: photo.url }}
                            style={{ width: 64, height: 64, borderRadius: 8 }}
                            contentFit="cover"
                          />
                          <Pressable
                            onPress={() => removePhoto(photo.id)}
                            hitSlop={8}
                            accessibilityLabel="Remove photo"
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: colors.destructive,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <X size={12} color="#fff" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null;
                })()}
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Chip
                    label="Camera"
                    size="sm"
                    leadingIcon={<Camera size={14} color={colors.foreground} />}
                    disabled={uploadingKey !== null}
                    onPress={() => addPhoto(room, 'camera')}
                  />
                  <Chip
                    label={uploadingKey === room.key ? 'Uploading…' : 'Library'}
                    size="sm"
                    leadingIcon={<ImagePlus size={14} color={colors.foreground} />}
                    disabled={uploadingKey !== null}
                    onPress={() => addPhoto(room, 'library')}
                  />
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
