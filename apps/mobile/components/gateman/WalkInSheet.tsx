import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react-native';
import { Button, Card, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { WatchlistCheckResult } from '@/components/gateman/WatchlistCheckResult';
import { gatemanApi, type Household, type VisitorPass } from '@/lib/api/gateman';
import {
  readWatchlistRefusal,
  type WatchlistRefusal,
  type WatchlistScreening,
} from '@/lib/gateman/watchlistRefusal';
import { qk } from '@/lib/query/keys';
import { haptics } from '@/lib/haptics';

export interface WalkInSheetProps {
  open: boolean;
  onClose: () => void;
  estateId: string;
  gateId?: string;
  onRaised: (pass: VisitorPass) => void;
}

// Submitting asks the household and never admits anyone. Households with no linked app account are disabled, since only their resident can consent.
export function WalkInSheet({ open, onClose, estateId, gateId, onRaised }: WalkInSheetProps) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [household, setHousehold] = useState<Household | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  /** Held here rather than toasted: it is the estate's answer, not a failure, and everything typed stays. */
  const [refusal, setRefusal] = useState<WatchlistRefusal | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  /** Never a refusal: a refusal belongs to the notice below, which owns the decision. */
  const [screening, setScreening] = useState<WatchlistScreening | null>(null);

  const householdsQuery = useQuery({
    queryKey: qk.gateman.households(estateId),
    queryFn: () => gatemanApi.listHouseholds(estateId, 1, 50),
    enabled: open && !!estateId,
  });

  // Derived inside the memo: `items ?? []` outside would allocate a fresh array every render and change the dependency on every pass.
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
    setScreening(null);
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

  const canCheck =
    !!household &&
    !request.isPending &&
    (visitorName.trim().length > 0 || visitorPhone.replace(/\D/g, '').length >= 7);

  const check = useMutation({
    mutationFn: () =>
      gatemanApi.screenWatchlist(estateId, {
        name: visitorName.trim() || undefined,
        phone: visitorPhone.trim() || undefined,
      }),
    onSuccess: (result) => {
      setOverrideError(null);
      if (result.blocked) {
        // Checked before the raise, so no household is asked to consent to somebody the estate has already refused.
        setScreening(null);
        setRefusal({ message: result.message ?? '', matches: result.matches });
        return;
      }
      setRefusal(null);
      setScreening(result);
    },
    onError: (error) => {
      void haptics.error();
      toast.show(
        error instanceof Error ? error.message : 'Could not check the watch list.',
        'error'
      );
    },
  });

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Visitor with no pass"
      snapPoints={['85%']}
      footer={
        <View style={{ gap: spacing.xs }}>
          {/* After a refusal the primary action is gone on purpose: a retry returns the same refusal; the only way forward is the override inside the notice. */}
          {refusal ? (
            <Button label="Close" variant="outline" fullWidth onPress={handleClose} />
          ) : (
            <>
              <Button
                label="Ask for approval"
                loadingLabel="Asking…"
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
                      : ' · nobody here uses the app, so they cannot approve: ask the estate office'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <TextField
          label="Visitor name"
          required
          value={visitorName}
          onChangeText={setVisitorName}
          placeholder="e.g. Tola Ade"
          hint="The household decides based on this, so use their real name."
        />
        <TextField
          label="Visitor phone"
          value={visitorPhone}
          onChangeText={(v) => setVisitorPhone(v.replace(/(?!^\+)\D/g, ''))}
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

        <View style={{ gap: spacing.xs }}>
          <Button
            label="Check the watch list"
            loadingLabel="Checking…"
            variant="outline"
            loading={check.isPending}
            fullWidth
            disabled={!canCheck}
            onPress={() => {
              setScreening(null);
              check.mutate();
            }}
          />
          {screening ? <WatchlistCheckResult screening={screening} /> : null}
        </View>
      </ScrollView>
    </Sheet>
  );
}
