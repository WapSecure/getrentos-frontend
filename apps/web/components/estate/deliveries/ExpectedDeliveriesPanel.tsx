'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Package, Plus } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Skeleton,
} from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { ApiError, unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import type { ExpectedDelivery, IssuedExpectedDelivery } from '@/types/estate';

/**
 * Parcels this household says are coming, and the code that proves it.
 *
 * The reason this exists, in the household's own terms: without a code, a parcel
 * is released on a courier's word alone, and the resident whose name was used has
 * no way to show it was never handed to them. So the panel leads with the action
 * that prevents that rather than with what has already arrived.
 *
 * Every label shown here comes from the server. The difference between "expired"
 * and "cancelled": two genuinely different things that happened to this
 * household: is decided once, in `delivery.util.ts`, so this screen cannot drift
 * into saying something the guard's own refusal would contradict.
 */
export const ExpectedDeliveriesPanel = () => {
  const queryClient = useQueryClient();
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [courier, setCourier] = useState('');
  const [description, setDescription] = useState('');
  const [issued, setIssued] = useState<IssuedExpectedDelivery | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.expectedDeliveries,
    // An empty list is the ordinary case, not a failure. `unwrap` would turn the
    // "nothing expected yet" screen into an error state.
    queryFn: () => unwrapOptional(estateResidentService.listMyExpectedDeliveries(), []),
  });
  const expected = data ?? [];
  const live = expected.filter((row) => row.live);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: estateResidentKeys.expectedDeliveries });
  };

  const declare = useMutation({
    mutationFn: () =>
      unwrap(
        estateResidentService.declareExpectedDelivery({
          courier: courier.trim(),
          description: description.trim() || undefined,
        })
      ),
    onSuccess: (row) => {
      // Presented immediately and deliberately: this is the only moment the code
      // exists outside the household's own app.
      setIssued(row);
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not get a code.'),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => unwrap(estateResidentService.cancelMyExpectedDelivery(id)),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not withdraw it.'),
  });

  const closeDeclare = () => {
    setIsDeclareOpen(false);
    setIssued(null);
    setCourier('');
    setDescription('');
    setCopied(false);
    setError(null);
  };

  const copyCode = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code);
      setCopied(true);
    } catch {
      // Clipboard access is refused in some contexts and the code is on screen to
      // be read out, so this is not worth surfacing as a failure.
      setCopied(false);
    }
  };

  return (
    <Card static className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">Expecting a parcel?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get a code for the courier. The guard checks it before the gate opens, so nobody can
            take a parcel in your name without it.
          </p>
        </div>
        <Button
          variant="primary"
          className="shrink-0"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsDeclareOpen(true)}
        >
          Get a code
        </Button>
      </div>

      {error && !isDeclareOpen && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="mt-4 h-16 w-full rounded-xl" />
      ) : expected.length === 0 ? (
        <EmptyState
          icon={Package}
          size="compact"
          className="mt-4"
          title="You have not told the estate about any parcels yet."
        />
      ) : (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {live.length > 0 ? `${live.length} still expected` : 'Nothing outstanding'}
          </p>
          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            {expected.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{row.summary}</p>
                  {row.receivedAtGateName && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Taken in at {row.receivedAtGateName}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={statusVariantFor(row.status)}>{row.statusLabel}</Badge>
                  {row.live && (
                    <Button
                      variant="ghost"
                      size="xs"
                      aria-label={`Withdraw ${row.summary}`}
                      onClick={() => withdraw.mutate(row.id)}
                      disabled={withdraw.isPending}
                      isLoading={withdraw.isPending && withdraw.variables === row.id}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isDeclareOpen} onOpenChange={(open) => !open && closeDeclare()}>
        <DialogContent size="md">
          {issued ? (
            <>
              <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                Code for your courier
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {issued.guidance}
              </DialogDescription>

              <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Give this to the courier
                </p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-foreground">
                  {issued.code}
                </p>
                <Button
                  variant="ghost"
                  className="mt-2"
                  icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  onClick={copyCode}
                >
                  {copied ? 'Copied' : 'Copy code'}
                </Button>
              </div>

              {/* Said plainly, because a resident who assumes they can look it
                  up later will not save it, and then cannot get it back. */}
              <p className="mt-3 text-xs text-muted-foreground">
                This is the only time the code is shown. If you lose it, withdraw this parcel and
                get a new one.
              </p>

              <div className="mt-6 border-t border-border pt-5">
                <Button variant="primary" fullWidth onClick={closeDeclare}>
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                What are you expecting?
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                The estate will see this until the code stops working, so the guard can check a
                courier&apos;s claim.
              </DialogDescription>

              <div className="mt-5 space-y-4">
                <Field label="Who is bringing it?" required>
                  <Input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g. Amazon, DHL"
                  />
                </Field>

                <Field label="What is coming?" optionalLabel="(optional)">
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. a phone case"
                  />
                </Field>

                <p className="text-xs text-muted-foreground">
                  The code works for 2 days, or until you withdraw it, and it only works once.
                </p>

                {error && <Alert variant="danger">{error}</Alert>}
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-5">
                <Button variant="ghost" onClick={closeDeclare}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={courier.trim().length === 0}
                  isLoading={declare.isPending}
                  loadingText="Getting code…"
                  onClick={() => declare.mutate()}
                >
                  Get code
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/**
 * A withdrawal and an expiry carry the same weight on purpose: neither is a
 * success and neither is something the household has to act on. They stay
 * textually distinct inside the label, which is where it matters.
 */
const statusVariantFor = (
  status: ExpectedDelivery['status']
): 'success' | 'warning' | 'neutral' => {
  if (status === 'RECEIVED') return 'success';
  if (status === 'AWAITING') return 'warning';
  return 'neutral';
};
