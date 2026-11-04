import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge, Button, Skeleton, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { ApiError } from '@/lib/api/client';
import { landlordApi, type LandlordMaintenance } from '@/lib/api/landlord';
import { triageApi } from '@/lib/api/triage';

const words = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
const URGENCY_TONE = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' } as const;

interface Props {
  request: LandlordMaintenance | null;
  onClose: () => void;
  /** After an accept changed the request. */
  onApplied: () => void;
}

/**
 * Automated triage on the phone: read the suggestion, then apply it (optionally
 * assigning the suggested vendor through the landlord's own assign path) or say
 * what it got wrong. Editing category and urgency stays on the web.
 */
export function TriageSheet({ request, onClose, onApplied }: Props) {
  return (
    <Sheet open={!!request} onClose={onClose} title="Automated triage">
      {request ? (
        <TriageBody key={request.id} request={request} onClose={onClose} onApplied={onApplied} />
      ) : null}
    </Sheet>
  );
}

function TriageBody({ request, onClose, onApplied }: Props & { request: LandlordMaintenance }) {
  const { spacing, radius, colors } = useTheme();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [alsoAssign, setAlsoAssign] = useState<boolean | null>(null);

  const triage = useQuery({
    queryKey: ['triage', request.id],
    queryFn: () => triageApi.triage(request.id),
    staleTime: Infinity,
    gcTime: 0,
  });
  const t = triage.data;
  const assign = alsoAssign ?? Boolean(t?.needsVendor && t?.suggestedVendor);

  const decide = useMutation({
    mutationFn: async (kind: 'accept' | 'reject') => {
      if (!t?.reviewId) throw new Error('This suggestion can no longer be decided.');
      const result = await triageApi.decide(
        request.id,
        t.reviewId,
        kind === 'accept' ? { decision: 'accept' } : { decision: 'reject', reason: reason.trim() }
      );
      let assigned = false;
      if (kind === 'accept' && assign && t.suggestedVendor) {
        try {
          await landlordApi.assignVendor(request.id, t.suggestedVendor.id);
          assigned = true;
        } catch (e) {
          toast.show(
            e instanceof ApiError
              ? e.message
              : 'The triage was applied, but the vendor could not be assigned.',
            'error'
          );
        }
      }
      return { result, assigned };
    },
    onSuccess: ({ result, assigned }) => {
      if (result.outcome === 'REJECTED') {
        toast.show('Thanks. Nothing was changed.', 'success');
      } else {
        toast.show(
          assigned ? 'Applied and vendor assigned.' : 'Category, urgency and scope applied.',
          'success'
        );
        onApplied();
      }
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not save your decision.', 'error'),
  });

  if (triage.isLoading) {
    return (
      <View style={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
        <Text variant="callout" color="mutedForeground">
          Reading the request…
        </Text>
        <Skeleton height={96} radius={radius.md} />
      </View>
    );
  }
  if (!t) {
    return (
      <Text variant="callout" color="mutedForeground">
        Could not triage this request right now.
      </Text>
    );
  }

  return (
    <View style={{ gap: spacing.md, paddingBottom: spacing.lg }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Badge label={words(t.category)} tone="neutral" />
        <Badge label={words(t.urgency)} tone={URGENCY_TONE[t.urgency]} />
        {t.needsVendor ? <Badge label="Needs a vendor" tone="info" /> : null}
      </View>
      <Text variant="callout">{t.rationale}</Text>
      <View
        style={{
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: 4,
        }}
      >
        <Text variant="caption" color="mutedForeground">
          Draft work order
        </Text>
        <Text variant="callout">{t.draftWorkOrder}</Text>
      </View>

      {rejecting ? (
        <TextField
          label="What did it get wrong?"
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={500}
          placeholder="For example: it is a plumbing leak, not electrical"
        />
      ) : t.suggestedVendor ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Switch
            value={assign}
            onValueChange={setAlsoAssign}
            accessibilityLabel={`Also assign ${t.suggestedVendor.name}`}
          />
          <Text variant="callout" style={{ flex: 1 }}>
            Also assign {t.suggestedVendor.name}
          </Text>
        </View>
      ) : null}

      {t.reviewId ? (
        rejecting ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Back"
              variant="outline"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={() => setRejecting(false)}
            />
            <Button
              label="Reject suggestion"
              fullWidth={false}
              style={{ flex: 1 }}
              disabled={reason.trim().length < 3}
              loading={decide.isPending}
              onPress={() => decide.mutate('reject')}
            />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Not right"
              variant="outline"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={() => setRejecting(true)}
            />
            <Button
              label="Apply"
              fullWidth={false}
              style={{ flex: 1 }}
              loading={decide.isPending}
              onPress={() => decide.mutate('accept')}
            />
          </View>
        )
      ) : null}

      <Text variant="caption" color="mutedForeground">
        {t.source === 'ai' ? 'Automated suggestion.' : 'Suggested from your rules.'} Always your
        call.
      </Text>
    </View>
  );
}
