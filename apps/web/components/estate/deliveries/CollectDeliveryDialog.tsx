'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Field, Input } from '@sureground/ui';
import { COLLECTOR_NAME_MAX_LENGTH, defaultCollectorName } from '@sureground/shared';
import type { DeliveryLog } from '@/types/estate';

interface CollectDeliveryDialogProps {
  /** The parcel being handed over; null keeps the dialog closed. */
  log: DeliveryLog | null;
  onClose: () => void;
  onConfirm: (collectedBy?: string) => void;
  isSubmitting?: boolean;
}

/** Keyed by parcel so the name resets to that household's resident each time it opens. */
export const CollectDeliveryDialog = ({
  log,
  onClose,
  onConfirm,
  isSubmitting,
}: CollectDeliveryDialogProps) => (
  <Dialog open={!!log} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
    <DialogContent size="sm">
      {log && (
        <CollectDeliveryForm
          key={log.id}
          log={log}
          onClose={onClose}
          onConfirm={onConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </DialogContent>
  </Dialog>
);

const CollectDeliveryForm = ({
  log,
  onClose,
  onConfirm,
  isSubmitting,
}: CollectDeliveryDialogProps & { log: DeliveryLog }) => {
  const [name, setName] = useState(() => defaultCollectorName(log));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(name.trim() || undefined);
      }}
    >
      <DialogTitle className="text-lg font-semibold text-foreground">Hand over parcel</DialogTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        {log.unitLabel}
        {log.courier ? ` · ${log.courier}` : ''}
      </p>

      <div className="mt-5">
        <Field
          label="Who is collecting it?"
          optionalLabel="(optional)"
          hint="Change this if someone else is picking it up for the household."
        >
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={COLLECTOR_NAME_MAX_LENGTH}
            disabled={isSubmitting}
            autoFocus
            placeholder="Name of the person taking it"
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Saving…">
          Confirm
        </Button>
      </div>
    </form>
  );
};
