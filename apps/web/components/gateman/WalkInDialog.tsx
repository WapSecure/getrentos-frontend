'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  ListSkeleton,
  RadioGroup,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { WatchlistCheckResult } from '@/components/gateman/WatchlistCheckResult';
import { estateKeys } from '@/lib/queryKeys';
import type { Household, VisitorPass, WatchlistScreening } from '@/types/estate';

interface WalkInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
  /** The barrier the visitor is standing at, when the console knows it. */
  gateId?: string;
  /** Fired once the household has been asked, so the guard sees what happened. */
  onRaised: (pass: VisitorPass) => void;
}

/**
 * Raises a walk-in: somebody is at the barrier with nothing arranged.
 *
 * The household is chosen from the estate's own list rather than typed, so the
 * request cannot be addressed to a unit that does not exist. Submitting asks the
 * household and does not admit anyone: the barrier stays shut until they answer.
 *
 * Households with no linked app account are shown but disabled. Only their
 * resident can consent, so a request to them could never be answered, and saying
 * so here is kinder than a rejection ten minutes later.
 */
export const WalkInDialog = ({
  isOpen,
  onClose,
  estateId,
  gateId,
  onRaised,
}: WalkInDialogProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [household, setHousehold] = useState<Household | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  /**
   * Set when the estate's watch list refused the visitor.
   *
   * Held here rather than shown as `error`, because it is the estate's answer
   * and not a failure: everything the guard typed stays exactly as it is, and
   * the only thing that changes the outcome is a stated reason to admit them.
   */
  const [refusal, setRefusal] = useState<WatchlistRefusal | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  /**
   * What the estate's list said when the guard asked before attempting the
   * raise. Set only for an answer that is not a refusal: a refusal is not an
   * advisory and belongs to the panel below, which owns the decision.
   */
  const [screening, setScreening] = useState<WatchlistScreening | null>(null);

  const { data: householdsData, isLoading } = useQuery({
    queryKey: [...estateKeys.households(estateId), { page: 1, pageSize: 50 }],
    queryFn: () =>
      unwrap(estateService.listHouseholds(estateId, { status: 'active', page: 1, pageSize: 50 })),
    enabled: isOpen && !!estateId,
  });

  const matches = useMemo(() => {
    const all = householdsData?.items ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (h) => h.unitLabel.toLowerCase().includes(term) || h.residentName.toLowerCase().includes(term)
    );
  }, [householdsData, search]);

  const reset = () => {
    setSearch('');
    setHousehold(null);
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setError(null);
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
      unwrap(
        estateService.requestWalkInVisitorPass(estateId, {
          householdId: household!.id,
          visitorName: visitorName.trim(),
          visitorPhone: visitorPhone.trim() || undefined,
          purpose: purpose.trim() || undefined,
          gateId,
          overrideReason,
        })
      ),
    onSuccess: (pass) => {
      queryClient.invalidateQueries({ queryKey: ['estate', estateId, 'walk-ins'] });
      onRaised(pass);
      reset();
      onClose();
    },
    onError: (err, input) => {
      const blocked = readWatchlistRefusal(err);
      if (blocked) {
        setError(null);
        setOverrideError(null);
        setRefusal(blocked);
        return;
      }
      // The estate refuses a request it cannot get answered; surfacing the API's
      // own words here is more use than a generic failure.
      const message = err instanceof Error ? err.message : 'Could not raise that request.';
      if (input?.overrideReason) {
        setOverrideError(message);
        return;
      }
      setError(message);
    },
  });

  const canSubmit = !!household && visitorName.trim().length > 0 && !request.isPending;

  /**
   * Asks about this visitor before anything is attempted.
   *
   * Needs the household first, because the question is "this visitor, coming to
   * see this unit": and because if the answer refuses them, the only way
   * forward is the override, which raises the request.
   */
  const canCheck =
    !!household &&
    !request.isPending &&
    (visitorName.trim().length > 0 || visitorPhone.replace(/\D/g, '').length >= 7);

  const check = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.screenWatchlist(estateId, {
          name: visitorName.trim() || undefined,
          phone: visitorPhone.trim() || undefined,
        })
      ),
    onSuccess: (result) => {
      setError(null);
      setOverrideError(null);
      if (result.blocked) {
        // The same answer the raise would give, reached earlier: before the
        // guard has promised the visitor anything, and without a household being
        // asked to consent to somebody the estate has already refused.
        setScreening(null);
        setRefusal({ message: result.message ?? '', matches: result.matches });
        return;
      }
      setRefusal(null);
      setScreening(result);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Could not check the watch list.'),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Visitor with no pass</DialogTitle>

        <div className="mt-4 space-y-4">
          <Field label="Who have they come to see?">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search unit or resident"
              leadingIcon={<Search className="w-4 h-4" aria-hidden="true" />}
            />
          </Field>

          {isLoading ? (
            <ListSkeleton rows={3} variant="cards" label="Loading households" />
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No household matches that.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto p-0.5">
              <RadioGroup
                variant="card"
                aria-label="Household"
                value={household?.id ?? ''}
                onValueChange={(id) => setHousehold(matches.find((h) => h.id === id) ?? null)}
                options={matches.map((h) => ({
                  value: h.id,
                  label: h.unitLabel,
                  description: h.residentLinked
                    ? h.residentName
                    : `${h.residentName} · nobody here uses the app, so they cannot approve: ask the estate office`,
                  disabled: !h.residentLinked,
                }))}
              />
            </div>
          )}

          <Field
            label="Visitor name"
            required
            hint="The household decides based on this, so use their real name."
          >
            <Input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Tola Ade"
            />
          </Field>

          <Field label="Phone" optionalLabel="(optional)">
            <Input
              type="tel"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="e.g. 08012345678"
            />
          </Field>

          <Field label="Reason" optionalLabel="(optional)">
            <Input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Plumbing repair"
            />
          </Field>

          {refusal && (
            <WatchlistBlockedNotice
              message={refusal.message}
              matches={refusal.matches}
              onOverride={(reason) => request.mutate({ overrideReason: reason })}
              isOverriding={request.isPending}
              error={overrideError}
            />
          )}

          {/* Last thing before the footer, because it is the last thing worth
              knowing before a household is asked. */}
          <div className="space-y-2">
            <Button
              variant="outline"
              fullWidth
              disabled={!canCheck}
              isLoading={check.isPending}
              loadingText="Checking…"
              onClick={() => {
                setScreening(null);
                check.mutate();
              }}
            >
              Check the watch list
            </Button>
            {screening && <WatchlistCheckResult screening={screening} />}
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
        </div>

        <div className="mt-6 space-y-2 border-t border-border pt-4">
          {/* Once the estate has refused, the primary action is gone on
              purpose. Leaving "Ask for approval" here would invite a retry
              that returns the same refusal while the visitor waits: the
              only route forward is the stated override inside the notice. */}
          {refusal ? (
            <Button variant="outline" fullWidth onClick={handleClose}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit}
                isLoading={request.isPending}
                loadingText="Asking…"
                onClick={() => request.mutate({})}
              >
                Ask for approval
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                The gate stays closed until the household answers. They have 10 minutes.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
