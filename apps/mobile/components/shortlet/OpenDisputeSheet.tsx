import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type ShortletBooking } from '@/lib/api/shortlets';
import type { DisputeCategory } from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { GUEST_DISPUTE_CATEGORIES } from '@/lib/stays';
import { haptics } from '@/lib/haptics';

const MIN_DESCRIPTION = 20;

/** Ask GetRentos support to step in on a stay. The thread continues in Disputes. */
export function OpenDisputeSheet(props: {
  open: boolean;
  onClose: () => void;
  booking: ShortletBooking;
  defaultCategory?: DisputeCategory;
}) {
  return <Inner key={props.open ? 'open' : 'closed'} {...props} />;
}

function Inner({
  open,
  onClose,
  booking,
  defaultCategory,
}: {
  open: boolean;
  onClose: () => void;
  booking: ShortletBooking;
  defaultCategory?: DisputeCategory;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [category, setCategory] = useState<DisputeCategory | null>(defaultCategory ?? null);
  const [description, setDescription] = useState('');

  const chosen = GUEST_DISPUTE_CATEGORIES.find((c) => c.value === category);
  const valid = !!category && description.trim().length >= MIN_DESCRIPTION;

  const submit = useMutation({
    mutationFn: () =>
      shortletsApi.openDispute(booking.id, {
        category: category!,
        title: `${chosen?.label ?? 'Problem'} — ${booking.propertyTitle}`.slice(0, 120),
        description: description.trim(),
      }),
    onSuccess: (d) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.shortlets.disputes });
      toast.show('Sent to GetRentos support.', 'success');
      onClose();
      router.push({ pathname: '/(app)/shortlet-dispute/[id]', params: { id: d.id } });
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Not sent.', 'error'),
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Ask support to step in"
      snapPoints={['88%']}
      footer={
        <Button
          label="Send to support"
          loading={submit.isPending}
          disabled={!valid}
          onPress={() => submit.mutate()}
        />
      }
    >
      <View style={{ gap: spacing.xl, paddingBottom: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          A person at GetRentos reads every dispute and hears from you and the host before deciding.
        </Text>

        <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
          <Text variant="subheading">What is it about?</Text>
          {GUEST_DISPUTE_CATEGORIES.map((c) => {
            const on = c.value === category;
            return (
              <Pressable
                key={c.value}
                onPress={() => {
                  void haptics.tap();
                  setCategory(c.value);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  borderWidth: on ? 2 : 1,
                  borderColor: on ? colors.foreground : colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{c.label}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {c.hint}
                  </Text>
                </View>
                {on ? <Check size={18} color={colors.foreground} /> : null}
              </Pressable>
            );
          })}
        </View>

        <TextField
          label="What happened?"
          value={description}
          onChangeText={setDescription}
          placeholder="The facts, in order. Dates and amounts help support decide quickly."
          multiline
          maxLength={2000}
          containerStyle={{ minHeight: 120 }}
          hint={
            description.trim().length < MIN_DESCRIPTION
              ? `At least ${MIN_DESCRIPTION} characters`
              : undefined
          }
        />
      </View>
    </Sheet>
  );
}
