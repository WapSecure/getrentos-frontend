import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { Button, Skeleton, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  MIN_CANDIDATE_SEARCH,
  agreementRequestedMessage,
  candidateState,
  estateMarketplaceApi,
  marketplaceKeys,
  type PropertyCandidate,
} from '@/lib/api/estateMarketplace';
import { haptics } from '@/lib/haptics';
import { MarketplaceFormError } from './MarketplaceUI';

/**
 * Bring a property into the estate and ask its owner for permission to market
 * it. Two steps, and the copy says so: only the owner can give the second.
 */
export function AddPropertySheet({
  open,
  onClose,
  estateId,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Add a property" snapPoints={['85%']}>
      {open ? <AddPropertyForm estateId={estateId} onDone={onClose} /> : null}
    </Sheet>
  );
}

function AddPropertyForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const term = useDebouncedValue(search.trim(), 350);
  const searching = term.length >= MIN_CANDIDATE_SEARCH;

  const candidates = useQuery({
    queryKey: marketplaceKeys.candidates(estateId, term),
    queryFn: () => estateMarketplaceApi.candidates(estateId, term),
    enabled: !!estateId && searching,
  });

  const request = useMutation({
    mutationFn: (c: PropertyCandidate) =>
      estateMarketplaceApi.requestAgreement(estateId, {
        propertyId: c.id,
        note: note.trim() || undefined,
      }),
    onSuccess: (agreement) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: marketplaceKeys.all(estateId) });
      toast.show(agreementRequestedMessage(agreement), 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        The property joins the estate straight away. Its owner then decides whether this estate may
        advertise it; they keep ownership and any money either way.
      </Text>
      <TextField
        label="Find the property"
        placeholder="Street, area or title"
        leftIcon={<Search size={16} color={colors.mutedForeground} />}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoFocus
        hint="At least three letters. Properties in another estate don’t show."
      />

      {!searching ? null : candidates.isPending ? (
        <Skeleton height={120} radius={radius.md} />
      ) : candidates.isError ? (
        <Text variant="callout" color="mutedForeground">
          Couldn’t search just now. Pull down on the marketplace and try again.
        </Text>
      ) : !candidates.data?.length ? (
        <Text variant="callout" color="mutedForeground">
          No matching property. Its owner needs to add it to GetRentos first.
        </Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {candidates.data.map((c) => {
            const state = candidateState(c);
            return (
              <View
                key={c.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  accessible
                  accessibilityLabel={`${c.title}, ${c.address}, ${c.city}. Owner ${c.ownerName}`}
                  style={{ flex: 1, gap: 2 }}
                >
                  <Text variant="callout" style={{ fontWeight: '700' }} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                    {[c.address, c.city].filter(Boolean).join(', ')} · {c.ownerName}
                  </Text>
                </View>
                {state === 'can-market' ? (
                  <StatusPill label="Can market" tone="success" />
                ) : state === 'awaiting' ? (
                  <StatusPill label="Awaiting owner" tone="warning" />
                ) : (
                  <Button
                    label={state === 'ask' ? 'Ask owner' : 'Add & ask'}
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    loading={request.isPending && request.variables?.id === c.id}
                    disabled={request.isPending}
                    accessibilityLabel={`${state === 'ask' ? 'Ask the owner of' : 'Add and ask the owner of'} ${c.title}`}
                    onPress={() => request.mutate(c)}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      <TextField
        label="Note for the owner (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={500}
        placeholder="e.g. We’d like to show it to buyers asking about the estate"
      />
      <MarketplaceFormError error={request.error} fallback="That property couldn’t be added." />
    </View>
  );
}
