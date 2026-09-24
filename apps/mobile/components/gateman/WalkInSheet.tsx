import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react-native';
import { Button, Card, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { gatemanApi, type Household, type VisitorPass } from '@/lib/api/gateman';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { qk } from '@/lib/query/keys';
import { haptics } from '@/lib/haptics';

export interface WalkInSheetProps {
  open: boolean;
  onClose: () => void;
  estateId: string;
  /** The barrier the visitor is standing at, when the console knows it. */
  gateId?: string;
  /** Fired once the household has been asked, so the caller can show the result. */
  onRaised: (pass: VisitorPass) => void;
}

/**
 * Raises a walk-in: somebody is at the barrier with nothing arranged.
 *
 * The guard picks the unit rather than quoting a code, because there is no code.
 * Submitting does NOT admit anyone — it asks the household, and the barrier
 * stays shut until they answer. That is why this screen is framed as a request
 * and never as "let them in".
 *
 * Households without a linked app account are shown but disabled: only their
 * resident can consent, so a request to them could never be answered and the
 * guard would spend the decision window discovering that. Saying so up front is
 * kinder than a rejection ten minutes later.
 */
export function WalkInSheet({ open, onClose, estateId, gateId, onRaised }: WalkInSheetProps) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [household, setHousehold] = useState<Household | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  /**
   * Set when the estate's watch list refused the visitor.
   *
   * Held here rather than toasted, because it is the estate's answer and not a
   * failure: everything the guard typed stays exactly as it is, and the only
   * thing that changes the outcome is a stated reason to admit them.
   */
  const [refusal, setRefusal] = useState<WatchlistRefusal | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const householdsQuery = useQuery({
    queryKey: qk.gateman.households(estateId),
    queryFn: () => gatemanApi.listHouseholds(estateId, 1, 50),
    enabled: open && !!estateId,
  });

  // Derived inside the memo from the query data itself: reading `items ?? []`
  // outside would allocate a fresh array every render and make the dependency
  // change on every pass.
  const matches = useMemo(() => {
    const households = householdsQuery.data?.items ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return households;
    return households.filter(
      (h) => h.unitLabel.toLowerCase().includes(term) || h.residentName.toLowerCase().includes(term)
    );
  }, [householdsQuery.data, search]);

  const reset = () => {
    setSearch('');
    setHousehold(null);
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setRefusal(null);
    setOverrideError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const request = useMutation({
    mutationFn: ({ overrideReason }: { overrideReason?: string } = {}) =>
      gatemanApi.requestWalkIn(estateId, {
        householdId: household!.id,
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        gateId,
        overrideReason,
      }),
    onSuccess: (pass) => {
      void haptics.success();
      onRaised(pass);
      toast.show(`Asked ${pass.unitLabel} to approve ${pass.visitorName}.`, 'success');
      if (estateId) {
        void qc.invalidateQueries({ queryKey: qk.gateman.walkIns(estateId) });
      }
      reset();
      onClose();
    },
    onError: (error, input) => {
      const blocked = readWatchlistRefusal(error);
      if (blocked) {
        setOverrideError(null);
        setRefusal(blocked);
        void haptics.error();
        return;
      }
      const message = error instanceof Error ? error.message : 'Could not raise that request.';
      if (input?.overrideReason) {
        setOverrideError(message);
        return;
      }
      void haptics.error();
      toast.show(message, 'error');
    },
  });

  const canSubmit = !!household && visitorName.trim().length > 1 && !request.isPending;

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Visitor with no pass"
      snapPoints={['85%']}
      footer={
        <View style={{ gap: spacing.xs }}>
          {/* Once the estate has refused, the primary action is gone on purpose.
              Leaving "Ask for approval" here would invite a retry that returns
              the same refusal while the visitor waits — the only route forward
              is the stated override inside the notice. */}
          {refusal ? (
            <Button label="Close" variant="outline" fullWidth onPress={handleClose} />
          ) : (
            <>
              <Button
                label={request.isPending ? 'Asking…' : 'Ask for approval'}
                loading={request.isPending}
                fullWidth
                disabled={!canSubmit}
                onPress={() => request.mutate({})}
              />
              <Text variant="caption" color="mutedForeground" center>
                The gate stays closed until the household answers. They have 10 minutes.
              </Text>
            </>
          )}
        </View>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <Text variant="bodyStrong">Who have they come to see?</Text>
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder="Search unit or resident"
            autoCorrect={false}
          />
        </View>

        {householdsQuery.isLoading ? (
          <Text variant="caption" color="mutedForeground">
            Loading households…
          </Text>
        ) : matches.length === 0 ? (
          <Text variant="caption" color="mutedForeground">
            No household matches that.
          </Text>
        ) : (
          <View style={{ gap: spacing.xs }}>
            {matches.map((h) => {
              const selected = household?.id === h.id;
              const reachable = h.residentLinked;
              return (
                <Pressable
                  key={h.id}
                  disabled={!reachable}
                  onPress={() => setHousehold(h)}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: !reachable }}
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.accent : colors.card,
                    borderRadius: 12,
                    padding: spacing.md,
                    opacity: reachable ? 1 : 0.5,
                  }}
                >
                  <Text variant="bodyStrong">{h.unitLabel}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {h.residentName}
                    {reachable
                      ? ''
                      : ' · nobody here uses the app, so they cannot approve — ask the estate office'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <TextField
          label="Visitor name"
          value={visitorName}
          onChangeText={setVisitorName}
          placeholder="e.g. Tola Ade"
          hint="The household decides based on this, so use their real name."
        />
        <TextField
          label="Visitor phone"
          value={visitorPhone}
          onChangeText={setVisitorPhone}
          placeholder="0803…"
          keyboardType="phone-pad"
          hint="Optional"
        />
        <TextField
          label="Reason for visit"
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Plumbing repair"
          hint="Optional"
        />

        {household ? (
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <UserPlus size={20} color={colors.mutedForeground} />
              <Text variant="caption" color="mutedForeground">
                {household.residentName} at {household.unitLabel} will be asked to approve. You can
                admit the visitor once they do.
              </Text>
            </View>
          </Card>
        ) : null}

        {refusal ? (
          <WatchlistBlockedNotice
            message={refusal.message}
            matches={refusal.matches}
            onOverride={(reason) => request.mutate({ overrideReason: reason })}
            isOverriding={request.isPending}
            error={overrideError}
          />
        ) : null}
      </ScrollView>
    </Sheet>
  );
}
