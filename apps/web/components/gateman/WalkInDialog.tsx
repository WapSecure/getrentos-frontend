'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { estateKeys } from '@/lib/queryKeys';
import type { Household, VisitorPass } from '@/types/estate';

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
 * household and does not admit anyone — the barrier stays shut until they answer.
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Visitor with no pass</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Who have they come to see?
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <LegacyInput
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search unit or resident"
                    className="pl-9"
                  />
                </div>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading households…</p>
              ) : matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No household matches that.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {matches.map((h) => {
                    const selected = household?.id === h.id;
                    const reachable = h.residentLinked;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        disabled={!reachable}
                        onClick={() => setHousehold(h)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          selected ? 'border-primary bg-primary/5' : 'border-border'
                        } ${reachable ? 'hover:bg-secondary' : 'opacity-50 cursor-not-allowed'}`}
                      >
                        <p className="text-sm font-medium text-foreground">{h.unitLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.residentName}
                          {reachable
                            ? ''
                            : ' · nobody here uses the app, so they cannot approve — ask the estate office'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Visitor name
                </label>
                <LegacyInput
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Tola Ade"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The household decides based on this, so use their real name.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <LegacyInput
                  type="text"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reason <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <LegacyInput
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Plumbing repair"
                />
              </div>

              {refusal && (
                <WatchlistBlockedNotice
                  message={refusal.message}
                  matches={refusal.matches}
                  onOverride={(reason) => request.mutate({ overrideReason: reason })}
                  isOverriding={request.isPending}
                  error={overrideError}
                />
              )}

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  {error}
                </p>
              )}
            </div>

            <div className="p-4 border-t border-border shrink-0 space-y-2">
              {/* Once the estate has refused, the primary action is gone on
                  purpose. Leaving "Ask for approval" here would invite a retry
                  that returns the same refusal while the visitor waits — the
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
                    onClick={() => request.mutate({})}
                  >
                    {request.isPending ? 'Asking…' : 'Ask for approval'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    The gate stays closed until the household answers. They have 10 minutes.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
