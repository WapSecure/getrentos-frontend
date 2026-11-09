import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
  FormAlert,
  NumberField,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi, type LandlordLease, type RenewalCheck } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { renewalAdviceApi, type RenewalAdvice } from '@/lib/api/renewalAdvice';
import { qk } from '@/lib/query/keys';
import type { ReplyLanguage } from '@/lib/replyLanguage';
import { RenewalAdviceCard } from './RenewalAdviceCard';

interface Props {
  open: boolean;
  onClose: () => void;
  lease: LandlordLease | null;
}

export function RenewLeaseSheet({ open, onClose, lease }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Renew this lease">
      {lease ? (
        <RenewForm
          key={lease.id}
          lease={lease}
          onClose={onClose}
          onSubmittingChange={setSubmitting}
        />
      ) : null}
    </Sheet>
  );
}

function RenewForm({
  lease,
  onClose,
  onSubmittingChange,
}: {
  lease: LandlordLease;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [rentAmount, setRentAmount] = useState(String(lease.rentAmount));
  const [leaseEnd, setLeaseEnd] = useState('');
  const [check, setCheck] = useState<RenewalCheck | null>(null);
  const [message, setMessage] = useState('');

  // Renew or re-let: fills the offer once, without overwriting anything typed.
  const [language, setLanguage] = useState<ReplyLanguage>('en');
  const canAdvise =
    lease.status === 'signed' || lease.status === 'active' || lease.status === 'expired';
  const advice = useQuery({
    queryKey: qk.landlord.renewalAdvice(lease.id, language),
    queryFn: () => renewalAdviceApi.get(lease.id, language),
    enabled: canAdvise,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const [touched, setTouched] = useState({ rent: false, end: false, message: false });
  const [appliedFrom, setAppliedFrom] = useState<RenewalAdvice | null>(null);
  if (advice.data && advice.data !== appliedFrom) {
    setAppliedFrom(advice.data);
    if (!touched.rent) setRentAmount(String(advice.data.draft.rentAmount));
    if (!touched.end) setLeaseEnd(advice.data.draft.leaseEnd);
    if (!touched.message) setMessage(advice.data.draft.message);
  }
  const applyAdvice = (a: RenewalAdvice) => {
    setRentAmount(String(a.draft.rentAmount));
    setLeaseEnd(a.draft.leaseEnd);
    setMessage(a.draft.message);
    setCheck(null);
    setTouched({ rent: false, end: false, message: false });
  };
  const englishCopy =
    advice.data?.draft.messageInEnglish && message === advice.data.draft.message
      ? advice.data.draft.messageInEnglish
      : null;

  const amount = Number(rentAmount);
  const increase =
    lease.rentAmount > 0 ? Math.round(((amount - lease.rentAmount) / lease.rentAmount) * 100) : 0;

  /**
   * The API owns the rent-increase advisory, so ask it rather than deciding
   * locally what counts as too steep.
   */
  const preview = useMutation({
    mutationFn: () => landlordApi.renewalCheck(lease.id, amount),
    onSuccess: setCheck,
    onError: () => setCheck(null),
  });

  const renew = useMutation({
    mutationFn: () => landlordApi.renewLease(lease.id, amount, leaseEnd, message),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      toast.show(
        message.trim() ? 'Renewal offer sent, with your note as a message.' : 'Renewal offer sent.',
        'success'
      );
      onClose();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send that renewal.'), 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  const valid = amount > 0 && leaseEnd;

  return (
    <View style={{ gap: spacing.lg }}>
      {canAdvise ? (
        <RenewalAdviceCard
          advice={advice.data}
          isLoading={advice.isLoading}
          isFetching={advice.isFetching && !advice.isLoading}
          language={language}
          onLanguageChange={setLanguage}
          onUse={applyAdvice}
        />
      ) : null}
      <Text variant="body" color="mutedForeground">
        {lease.tenantName} currently pays {formatNaira(lease.rentAmount)}.
      </Text>

      <NumberField
        currency
        label="New rent"
        value={rentAmount}
        onValueChange={(v) => {
          setRentAmount(v);
          setCheck(null);
          setTouched((t) => ({ ...t, rent: true }));
        }}
        onBlur={() => {
          if (amount > 0 && !renew.isPending) preview.mutate();
        }}
        editable={!renew.isPending}
        hint={
          amount > 0 && amount !== lease.rentAmount
            ? `${increase > 0 ? '+' : ''}${increase}% on the current rent`
            : undefined
        }
        required
      />

      {check?.message ? <FormAlert tone="warning" message={check.message} /> : null}

      <DateField
        label="New end date"
        value={leaseEnd}
        onChange={(v) => {
          setLeaseEnd(v);
          setTouched((t) => ({ ...t, end: true }));
        }}
        min={lease.leaseEnd}
        disabled={renew.isPending}
      />

      <TextField
        label={`Note to ${lease.tenantName || 'the tenant'}`}
        hint="Sent to them as a message with the offer. Leave empty to send the offer alone."
        value={message}
        onChangeText={(v) => {
          setMessage(v);
          setTouched((t) => ({ ...t, message: true }));
        }}
        multiline
        maxLength={1000}
        editable={!renew.isPending}
        optional
      />
      {englishCopy ? (
        <Text variant="caption" color="mutedForeground">
          In English: {englishCopy}
        </Text>
      ) : null}

      <Button
        label="Send renewal offer"
        loading={renew.isPending}
        disabled={renew.isPending || !valid}
        onPress={() => renew.mutate()}
      />
    </View>
  );
}
