import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, NumberField, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { buyerOffersApi, type BuyerOffer } from '@/lib/api/buyerOffers';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  offer: BuyerOffer | null;
}

export function CounterOfferSheet({ open, onClose, offer }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Counter this offer">
      {/* Remount on each open so the form always starts blank. */}
      {offer ? (
        <CounterForm
          key={open ? 'open' : 'closed'}
          onClose={onClose}
          onSubmittingChange={setSubmitting}
          offer={offer}
        />
      ) : null}
    </Sheet>
  );
}

function CounterForm({
  onClose,
  onSubmittingChange,
  offer,
}: {
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
  offer: BuyerOffer;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState(String(offer.offerAmount));
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => buyerOffersApi.counter(offer.id, Number(amount), message.trim() || undefined),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyer.offerThread(offer.id) });
      qc.invalidateQueries({ queryKey: ['buyer', 'offers'] });
      toast.show('Counter offer sent.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not send this counter offer.',
        'error'
      ),
    onSettled: () => onSubmittingChange(false),
  });

  const canSubmit = Number(amount) > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Propose a new amount for <Text variant="bodyStrong">{offer.propertyTitle}</Text>.
      </Text>
      <NumberField
        label="Your counter amount"
        value={amount}
        onValueChange={setAmount}
        currency
        required
        editable={!mutation.isPending}
      />
      <TextField
        label="Message"
        optional
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
        editable={!mutation.isPending}
      />
      <Button
        label="Send counter offer"
        loading={mutation.isPending}
        disabled={mutation.isPending || !canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
