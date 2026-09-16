import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
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
  return (
    <Sheet open={open} onClose={onClose} title="Counter this offer">
      {/* Remount on each open so the form always starts blank. */}
      {offer ? (
        <CounterForm key={open ? 'open' : 'closed'} onClose={onClose} offer={offer} />
      ) : null}
    </Sheet>
  );
}

function CounterForm({ onClose, offer }: { onClose: () => void; offer: BuyerOffer }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState(String(offer.offerAmount));
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => buyerOffersApi.counter(offer.id, Number(amount), message.trim() || undefined),
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
  });

  const canSubmit = Number(amount) > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Propose a new amount for <Text variant="bodyStrong">{offer.propertyTitle}</Text>.
      </Text>
      <TextField
        label="Your counter amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
      />
      <TextField
        label="Message (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
      />
      <Button
        label="Send counter offer"
        loading={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
