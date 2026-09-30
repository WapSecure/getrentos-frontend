'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, MapPin, Plus, RotateCcw, ShieldOff, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Skeleton,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { IssuedPatrolCheckpoint, PatrolCheckpoint } from '@/types/estate';

/**
 * The estate's patrol points, and the codes that live at them.
 *
 * The screen leads with adding a checkpoint rather than with the list, because
 * a register with nothing in it is the normal starting state and the code is the
 * only thing that has to be dealt with carefully: it is shown once, here, and
 * never again. That is not a limitation to apologise for: a code the office
 * could read back is one it could read out to somebody who is not at the
 * checkpoint, and the whole mechanism is that the code is proof of presence.
 */
export const CheckpointRegister = ({ estateId }: { estateId: string }) => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [issued, setIssued] = useState<IssuedPatrolCheckpoint | null>(null);
  const [copied, setCopied] = useState(false);
  const [reissuing, setReissuing] = useState<PatrolCheckpoint | null>(null);
  const [retiring, setRetiring] = useState<PatrolCheckpoint | null>(null);

  const checkpointsQuery = useQuery({
    queryKey: estateKeys.patrolCheckpoints(estateId),
    queryFn: () => unwrap(estateService.listPatrolCheckpoints(estateId)),
  });

  const reset = () => {
    setIsAddOpen(false);
    setName('');
    setLocation('');
  };

  const createMutation = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.createPatrolCheckpoint(estateId, { name, location: location || undefined })
      ),
    onSuccess: (checkpoint) => {
      setIssued(checkpoint);
      setCopied(false);
      reset();
      queryClient.invalidateQueries({ queryKey: estateKeys.patrolCheckpoints(estateId) });
      // The routes read the register, so a new point can be added to a round.
      queryClient.invalidateQueries({ queryKey: estateKeys.patrolRoutes(estateId) });
    },
  });

  const reissueMutation = useMutation({
    mutationFn: (checkpointId: string) =>
      unwrap(estateService.reissuePatrolCheckpointCode(estateId, checkpointId)),
    onSuccess: (checkpoint) => {
      setIssued(checkpoint);
      setCopied(false);
      setReissuing(null);
      queryClient.invalidateQueries({ queryKey: estateKeys.patrolCheckpoints(estateId) });
    },
  });

  const retireMutation = useMutation({
    mutationFn: (checkpoint: PatrolCheckpoint) =>
      unwrap(
        estateService.updatePatrolCheckpoint(estateId, checkpoint.id, {
          active: !checkpoint.active,
        })
      ),
    onSuccess: () => {
      setRetiring(null);
      queryClient.invalidateQueries({ queryKey: estateKeys.patrolCheckpoints(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.patrolRoutes(estateId) });
    },
  });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard access can be refused; the code is on screen to read anyway.
      setCopied(false);
    }
  };

  if (checkpointsQuery.isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const checkpoints = checkpointsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Checkpoints</h2>
          <p className="text-sm text-muted-foreground">
            Somewhere a guard has to reach. Print the code and put it up there.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add checkpoint
        </Button>
      </div>

      {issued && (
        <IssuedCodeNotice
          checkpoint={issued}
          copied={copied}
          onCopy={() => copy(issued.code)}
          onDismiss={() => setIssued(null)}
        />
      )}

      {checkpoints.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No checkpoints yet"
          description="Add the places a patrol has to reach: the gate, the generator house, the back fence. Each one gets a code you print and put up there."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {checkpoints.map((checkpoint) => (
            <Card key={checkpoint.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{checkpoint.name}</p>
                  {checkpoint.location && (
                    <p className="truncate text-sm text-muted-foreground">{checkpoint.location}</p>
                  )}
                </div>
                {checkpoint.active ? (
                  <Badge variant="success">In use</Badge>
                ) : (
                  <Badge variant="neutral">Retired</Badge>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {checkpoint.routeCount === 0
                  ? 'On no route yet'
                  : `On ${checkpoint.routeCount} route${checkpoint.routeCount === 1 ? '' : 's'}`}
                {' · '}
                {checkpoint.scanCount === 0
                  ? 'Never scanned'
                  : `Scanned ${checkpoint.scanCount} time${checkpoint.scanCount === 1 ? '' : 's'}`}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setReissuing(checkpoint)}
                  disabled={!checkpoint.active}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New code
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setRetiring(checkpoint)}
                >
                  {checkpoint.active ? (
                    <>
                      <ShieldOff className="h-3.5 w-3.5" />
                      Retire
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Put back in use
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mounted only while open, so a second checkpoint cannot inherit the
          first one's name: the same trap that has caught three dialogs in this
          programme already. */}
      <Dialog open={isAddOpen} onOpenChange={(open) => (open ? setIsAddOpen(true) : reset())}>
        <DialogContent>
          {isAddOpen && (
            <div className="space-y-4">
              <div>
                <DialogTitle>Add a checkpoint</DialogTitle>
                <DialogDescription>
                  A place a patrol has to reach. You will get a code once, to print and put up
                  there.
                </DialogDescription>
              </div>

              <Field label="Name" required htmlFor="checkpoint-name">
                <Input
                  id="checkpoint-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Main gate"
                />
              </Field>

              <Field
                label="Where it is"
                htmlFor="checkpoint-location"
                hint="In your own words, so a guard comparing it to what they see knows they are in the right place."
              >
                <Input
                  id="checkpoint-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Beside the boom, facing the road"
                />
              </Field>

              {createMutation.error && (
                <p className="text-sm text-destructive">
                  {(createMutation.error as Error).message}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={reset}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!name.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Adding…' : 'Add checkpoint'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!reissuing}
        onOpenChange={(open) => !open && setReissuing(null)}
        title={reissuing ? `Give ${reissuing.name} a new code?` : ''}
        description="The code on the wall stops working immediately. Do this if the label has gone missing, or if somebody who should not have it has seen it."
        confirmLabel="Give a new code"
        onConfirm={() => reissuing && reissueMutation.mutate(reissuing.id)}
        isLoading={reissueMutation.isPending}
      />

      <ConfirmDialog
        open={!!retiring}
        onOpenChange={(open) => !open && setRetiring(null)}
        title={
          retiring
            ? retiring.active
              ? `Retire ${retiring.name}?`
              : `Put ${retiring.name} back in use?`
            : ''
        }
        description={
          retiring?.active
            ? 'It stops counting towards rounds, and its code stops working. Every scan it has ever recorded is kept: retiring a checkpoint never erases the patrols that visited it.'
            : 'It starts counting towards rounds again. Its old code still works, so give it a new one if that code may have been seen.'
        }
        confirmLabel={retiring?.active ? 'Retire' : 'Put back in use'}
        onConfirm={() => retiring && retireMutation.mutate(retiring)}
        isLoading={retireMutation.isPending}
      />
    </div>
  );
};

/**
 * The one moment a code is readable.
 *
 * Deliberately loud, and it says where the code belongs rather than only what it
 * is: printing a code and leaving it on the office desk produces a register that
 * anybody can scan from indoors, which is the failure mode the whole feature
 * exists to avoid. The wording underneath comes from the server so the console
 * and the guard's refusal cannot describe the same code differently.
 */
const IssuedCodeNotice = ({
  checkpoint,
  copied,
  onCopy,
  onDismiss,
}: {
  checkpoint: IssuedPatrolCheckpoint;
  copied: boolean;
  onCopy: () => void;
  onDismiss: () => void;
}) => (
  <Card className="border-primary/40 bg-accent/40 p-4">
    <div className="flex items-start gap-3">
      <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">Code for {checkpoint.name}: shown once</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-2xl tracking-[0.3em] text-foreground">
            {checkpoint.code}
          </code>
          <Button variant="outline" size="sm" className="gap-2" onClick={onCopy}>
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{checkpoint.guidance}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          It cannot be shown again. If it goes missing, give the checkpoint a new code.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        Done
      </Button>
    </div>
  </Card>
);
