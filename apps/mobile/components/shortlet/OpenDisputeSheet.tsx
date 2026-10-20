import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, RadioGroup, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
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
  const { spacing } = useTheme();
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
        title: `${chosen?.label ?? 'Problem'}: ${booking.propertyTitle}`.slice(0, 120),
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
      onClose={submit.isPending ? () => undefined : onClose}
      title="Ask support to step in"
      snapPoints={['88%']}
      footer={
        <Button
          label="Send to support"
          loading={submit.isPending}
          disabled={submit.isPending || !valid}
          onPress={() => submit.mutate()}
        />
      }
    >
      <View style={{ gap: spacing.xl, paddingBottom: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          A person at GetRentos reads every dispute and hears from you and the host before deciding.
        </Text>

        <View style={{ gap: spacing.sm }}>
          <Text variant="subheading">What is it about?</Text>
          <RadioGroup
            variant="card"
            value={category}
            onChange={(next) => {
              void haptics.tap();
              setCategory(next);
            }}
            options={GUEST_DISPUTE_CATEGORIES.map((c) => ({
              value: c.value,
              label: c.label,
              description: c.hint,
              disabled: submit.isPending,
            }))}
          />
        </View>

        <TextField
          label="What happened?"
          required
          value={description}
          onChangeText={setDescription}
          editable={!submit.isPending}
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
