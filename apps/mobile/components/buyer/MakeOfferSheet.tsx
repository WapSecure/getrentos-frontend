import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  FormAlert,
  NumberField,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { buyerOffersApi, type BuyerFinancingType } from '@/lib/api/buyerOffers';
import { foreignIdentityApi } from '@/lib/api/foreignIdentity';
import type { BuyerListingTarget } from '@/lib/api/buyer';
import { errorMessage } from '@/lib/api/client';
import { VerificationGateNotice } from '@/components/VerificationGateNotice';
import { readGate } from '@/lib/verificationGate';

interface Props {
  open: boolean;
  onClose: () => void;
  listing: BuyerListingTarget | null;
}

const FINANCING_OPTIONS: { value: BuyerFinancingType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'installment', label: 'Instalment' },
];

export function MakeOfferSheet({ open, onClose, listing }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Make an offer">
      {/* Remount on each open so the form always starts blank. */}
      {listing ? (
        <OfferForm
          key={open ? 'open' : 'closed'}
          onClose={onClose}
          onSubmittingChange={setSubmitting}
          listing={listing}
        />
      ) : null}
    </Sheet>
  );
}

function OfferForm({
  onClose,
  onSubmittingChange,
  listing,
}: {
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
  listing: BuyerListingTarget;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState(String(listing.askingPrice));
  const [depositAmount, setDepositAmount] = useState('');
  const [financingType, setFinancingType] = useState<BuyerFinancingType>('cash');
  const [message, setMessage] = useState('');
  // DIA-07: asked before sending, so a large offer is not refused with a 403.
  const [fundsHold, setFundsHold] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const hold = await foreignIdentityApi.sourceOfFundsHold(Number(amount));
      setFundsHold(hold);
      if (hold) return null;
      return buyerOffersApi.create({
        listingId: listing.id,
        amount: Number(amount),
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
        financingType,
        message: message.trim() || undefined,
      });
    },
    onMutate: () => onSubmittingChange(true),
    onSuccess: (offer) => {
      if (!offer) return;
      qc.invalidateQueries({ queryKey: ['buyer', 'offers'] });
      qc.invalidateQueries({ queryKey: qk.buyer.dashboard });
      toast.show('Offer submitted.', 'success');
      onClose();
      router.push(`/(app)/buyer-offer/${offer.id}`);
    },
    onError: (err) => {
      if (readGate(err)) return;
      toast.show(errorMessage(err, 'Could not submit this offer.'), 'error');
    },
    onSettled: () => onSubmittingChange(false),
  });

  const canSubmit = Number(amount) > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Make an offer on <Text variant="bodyStrong">{listing.title}</Text>.
      </Text>
      <NumberField
        label="Offer amount"
        value={amount}
        onValueChange={setAmount}
        currency
        required
        editable={!mutation.isPending}
      />
      <NumberField
        label="Deposit amount"
        optional
        value={depositAmount}
        onValueChange={setDepositAmount}
        currency
        editable={!mutation.isPending}
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
              disabled={mutation.isPending}
            />
          ))}
        </View>
      </View>
      <TextField
        label="Message"
        optional
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
        editable={!mutation.isPending}
      />
      {fundsHold ? (
        <View style={{ gap: spacing.sm }}>
          <FormAlert tone="warning" title="Confirm your source of funds" message={fundsHold} />
          <Button
            label="Go to Identity abroad"
            variant="outline"
            size="sm"
            onPress={() => {
              onClose();
              router.push('/(app)/invest-identity');
            }}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      ) : null}
      <VerificationGateNotice
        error={mutation.error}
        scoreHref="/(app)/buyer-trust-profile"
        onNavigate={onClose}
      />
      <Button
        label="Submit offer"
        loading={mutation.isPending}
        disabled={mutation.isPending || !canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
