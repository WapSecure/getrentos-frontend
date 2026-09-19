import { useState } from 'react';
import { Image, Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, ChevronLeft, Plus, X } from 'lucide-react-native';
import { Button, Card, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  maintenanceApi,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_CATEGORY_LABEL,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_PRIORITY_LABEL,
  type MaintenanceCategory,
  type MaintenancePriority,
} from '@/lib/api/maintenance';
import { pickPhoto } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';

const MAX_PHOTOS = 5;

export default function ReportMaintenance() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory | null>(null);
  const [priority, setPriority] = useState<MaintenancePriority>('medium');
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [photos, setPhotos] = useState<PickedFile[]>([]);

  const effectivePriority = isEmergency ? 'urgent' : priority;

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceApi.create({
        title: title.trim(),
        category: category!,
        priority: effectivePriority,
        description: description.trim(),
        isEmergency,
        photos,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.maintenance });
      toast.show('Maintenance request submitted.', 'success');
      router.back();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not submit this request.', 'error'),
  });

  const addPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const file = await pickPhoto();
    if (file) setPhotos((p) => [...p, file]);
  };

  const canSubmit = title.trim().length > 0 && !!category && description.trim().length > 0;

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
        <Text variant="title">Report an issue</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <Card elevated>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <AlertTriangle size={17} color={colors.destructive} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">This is an emergency</Text>
                <Text variant="caption" color="mutedForeground">
                  Fire, gas leak, or a life-threatening issue
                </Text>
              </View>
            </View>
            <Switch
              value={isEmergency}
              onValueChange={setIsEmergency}
              trackColor={{ true: colors.destructive, false: colors.secondary }}
              thumbColor={colors.card}
            />
          </View>
          {isEmergency ? (
            <Text variant="caption" color="destructive" style={{ marginTop: spacing.sm }}>
              For a life-threatening emergency, call your local emergency services first. This
              report will be marked urgent and sent to your landlord immediately.
            </Text>
          ) : null}
        </Card>

        <TextField
          label="What's wrong?"
          placeholder="e.g. Kitchen tap won't stop leaking"
          value={title}
          onChangeText={setTitle}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={MAINTENANCE_CATEGORY_LABEL[c]}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Priority</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {MAINTENANCE_PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={MAINTENANCE_PRIORITY_LABEL[p]}
                selected={effectivePriority === p}
                disabled={isEmergency}
                onPress={() => setPriority(p)}
              />
            ))}
          </View>
          {isEmergency ? (
            <Text variant="caption" color="mutedForeground">
              Priority is set to urgent while this is marked an emergency.
            </Text>
          ) : null}
        </View>

        <TextField
          label="Describe the issue"
          placeholder="What's happening, and since when?"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Photos (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {photos.map((p, i) => (
              <View key={p.uri} style={{ width: 76, height: 76 }}>
                <Image
                  source={{ uri: p.uri }}
                  style={{ width: 76, height: 76, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.destructive,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} color={colors.destructiveForeground} />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <Pressable
                onPress={addPhoto}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={20} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Button
          label="Submit request"
          loading={mutation.isPending}
          disabled={!canSubmit}
          onPress={() => mutation.mutate()}
        />
      </ScrollView>
    </View>
  );
}
