import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { buyerOffersApi, type BuyerFinancingType } from '@/lib/api/buyerOffers';
import type { BuyerListing } from '@/lib/api/buyer';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  listing: BuyerListing | null;
}

const FINANCING_OPTIONS: { value: BuyerFinancingType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'installment', label: 'Installment' },
];

export function MakeOfferSheet({ open, onClose, listing }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Make an offer">
      {/* Remount on each open so the form always starts blank. */}
      {listing ? (
        <OfferForm key={open ? 'open' : 'closed'} onClose={onClose} listing={listing} />
      ) : null}
    </Sheet>
  );
}

function OfferForm({ onClose, listing }: { onClose: () => void; listing: BuyerListing }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState(String(listing.askingPrice));
  const [depositAmount, setDepositAmount] = useState('');
  const [financingType, setFinancingType] = useState<BuyerFinancingType>('cash');
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      buyerOffersApi.create({
        listingId: listing.id,
        amount: Number(amount),
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
        financingType,
        message: message.trim() || undefined,
      }),
    onSuccess: (offer) => {
      qc.invalidateQueries({ queryKey: ['buyer', 'offers'] });
      qc.invalidateQueries({ queryKey: qk.buyer.dashboard });
      toast.show('Offer submitted.', 'success');
      onClose();
      router.push(`/(app)/buyer-offer/${offer.id}`);
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not submit this offer.', 'error'),
  });

  const canSubmit = Number(amount) > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Make an offer on <Text variant="bodyStrong">{listing.title}</Text>.
      </Text>
      <TextField
        label="Offer amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
      />
      <TextField
        label="Deposit amount (optional)"
        value={depositAmount}
        onChangeText={setDepositAmount}
        keyboardType="number-pad"
      />
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Financing</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {FINANCING_OPTIONS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              size="sm"
              selected={financingType === f.value}
              onPress={() => setFinancingType(f.value)}
            />
          ))}
        </View>
      </View>
      <TextField
        label="Message (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
      />
      <Button
        label="Submit offer"
        loading={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
