import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Camera, Check, Clock, ImagePlus, X } from 'lucide-react-native';
import {
  Button,
  EmptyState,
  FormAlert,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { SupportContact } from '@/components/shortlet/StayUI';
import { useMyStays } from '@/components/shortlet/useMyStays';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type GuestPromiseProblem } from '@/lib/api/shortlets';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';
import { capturePhoto, pickPhotos } from '@/lib/filePicker';
import { PROBLEM_OPTIONS, formatDeadline, promiseState } from '@/lib/stays';
import { haptics } from '@/lib/haptics';

const MAX_PHOTOS = 6;
const MIN_DESCRIPTION = 20;

/**
 * The Guest Promise, used: within 24 hours of check-in the guest tells us the
 * stay isn't what they paid for. Photos upload only when they send it.
 */
export default function GuestPromiseReport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const stays = useMyStays();
  const b = stays.data?.find((x) => x.id === id);

  const [problem, setProblem] = useState<GuestPromiseProblem | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PickedFile[]>([]);
  const [progress, setProgress] = useState<string | null>(null);

  const addPhotos = (more: PickedFile[]) =>
    setPhotos((list) => [...list, ...more].slice(0, MAX_PHOTOS));

  const send = useMutation({
    mutationFn: async () => {
      const imageKeys: string[] = [];
      for (let i = 0; i < photos.length; i += 1) {
        setProgress(`Uploading photo ${i + 1} of ${photos.length}…`);
        const { key } = await shortletsApi.uploadPromisePhoto(id, photos[i]);
        imageKeys.push(key);
      }
      setProgress('Sending your report…');
      return shortletsApi.reportGuestPromise(id, {
        problemType: problem!,
        description: description.trim(),
        imageKeys: imageKeys.length ? imageKeys : undefined,
      });
    },
    onSuccess: (dispute) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['shortlets', 'bookings'] });
      qc.invalidateQueries({ queryKey: qk.shortlets.disputes });
      toast.show("Reported. We're holding the host's payment while we check.", 'success');
      router.replace({ pathname: '/(app)/shortlet-dispute/[id]', params: { id: dispute.id } });
    },
    onError: (e) => {
      void haptics.error();
      toast.show(
        e instanceof ApiError ? e.message : 'Not sent. Check your connection and try again.',
        'error'
      );
    },
    onSettled: () => setProgress(null),
  });

  const state = b ? promiseState(b) : null;
  const open = state?.kind === 'open';
  const valid = !!problem && description.trim().length >= MIN_DESCRIPTION;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing['2xl'],
        }}
      >
        <DetailHeader
          eyebrow="Guest Promise"
          title="Report a problem"
          subtitle={b?.propertyTitle}
          onBack={() => router.back()}
        />

        {!b ? (
          stays.isPending ? (
            <Skeleton height={200} radius={radius.lg} />
          ) : (
            <EmptyState title="Stay not found" />
          )
        ) : !open ? (
          <View style={{ gap: spacing.lg }}>
            <FormAlert
              tone="info"
              title={state?.kind === 'reported' ? 'Already reported' : 'Reporting is closed'}
              message={
                state?.kind === 'reported'
                  ? 'We’re already looking into this stay. Follow it in Disputes.'
                  : state?.kind === 'upcoming'
                    ? `You can report from check-in until ${formatDeadline(state.closesAt)}.`
                    : 'The Guest Promise covers the first 24 hours after check-in. For anything else, ask support to step in from your stay.'
              }
            />
            <SupportContact />
          </View>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: colors.warningSubtle,
              }}
            >
              <Clock size={17} color={colors.warning} />
              <Text variant="callout" style={{ flex: 1, color: colors.foreground }}>
                Report by{' '}
                <Text variant="callout" style={{ fontWeight: '700' }}>
                  {formatDeadline(state.closesAt)}
                </Text>
                . The host isn’t paid while we check.
              </Text>
            </View>

            <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
              <Text variant="heading">What’s wrong?</Text>
              {PROBLEM_OPTIONS.map((o) => {
                const on = o.value === problem;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      void haptics.tap();
                      setProblem(o.value);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                      borderRadius: radius.lg,
                      borderWidth: on ? 2 : 1,
                      borderColor: on ? colors.foreground : colors.border,
                      backgroundColor: colors.card,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{o.label}</Text>
                      <Text variant="callout" color="mutedForeground">
                        {o.hint}
                      </Text>
                    </View>
                    {on ? <Check size={20} color={colors.foreground} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading">Tell us what you found</Text>
              <TextField
                value={description}
                onChangeText={setDescription}
                placeholder="What’s different from the listing, and what you’ve tried."
                accessibilityLabel="What you found"
                multiline
                maxLength={2000}
                containerStyle={{ minHeight: 130 }}
                hint={
                  description.trim().length < MIN_DESCRIPTION
                    ? `At least ${MIN_DESCRIPTION} characters`
                    : `${description.trim().length} / 2000`
                }
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading">Photos</Text>
              <Text variant="callout" color="mutedForeground">
                Up to {MAX_PHOTOS}. They make the difference when support decides.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {photos.map((p, i) => (
                  <View key={`${p.uri}-${i}`}>
                    <Image
                      source={{ uri: p.uri }}
                      contentFit="cover"
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: radius.md,
                        backgroundColor: colors.secondary,
                      }}
                      accessibilityLabel={`Photo ${i + 1}`}
                    />
                    <Pressable
                      onPress={() => setPhotos((list) => list.filter((_, j) => j !== i))}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${i + 1}`}
                      hitSlop={8}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                      }}
                    >
                      <X size={14} color="#ffffff" />
                    </Pressable>
                  </View>
                ))}
              </View>
              {photos.length < MAX_PHOTOS ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Take photo"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    icon={<Camera size={16} color={colors.foreground} />}
                    onPress={async () => {
                      const p = await capturePhoto();
                      if (p) addPhotos([p]);
                    }}
                  />
                  <Button
                    label="Choose photos"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    icon={<ImagePlus size={16} color={colors.foreground} />}
                    onPress={async () => addPhotos(await pickPhotos(MAX_PHOTOS - photos.length))}
                  />
                </View>
              ) : null}
            </View>

            <View style={{ gap: spacing.sm }}>
              <Button
                label={progress ?? 'Send report'}
                size="lg"
                loading={send.isPending}
                disabled={!valid || send.isPending}
                onPress={() => send.mutate()}
              />
              <Text variant="caption" color="mutedForeground" center>
                A person at GetRentos reviews it with you and the host. If we uphold it, you get
                your money back.
              </Text>
            </View>

            <SupportContact
              lead="Stuck at the gate right now? Talk to us."
              context={`Guest Promise: ${b.propertyTitle} (${b.id.slice(0, 8)})`}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
