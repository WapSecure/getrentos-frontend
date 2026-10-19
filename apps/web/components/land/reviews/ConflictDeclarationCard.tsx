'use client';

import { useState } from 'react';
import { Button, Card, Field, Textarea } from '@getrentos/ui';
import { ShieldAlert } from 'lucide-react';

/**
 * The conflict-of-interest declaration every engaged professional makes once,
 * before deciding anything. Declaring a conflict withdraws them from the case
 * so GetRentos can engage someone else; it is recorded, not penalised.
 */
export const ConflictDeclarationCard = ({
  onDeclare,
  isSaving,
}: {
  onDeclare: (declaration: 'NONE' | 'DECLARED', note?: string) => void;
  isSaving: boolean;
}) => {
  const [declaring, setDeclaring] = useState(false);
  const [note, setNote] = useState('');
  const noteLength = note.trim().length;

  return (
    <Card className="border-warning/40 bg-warning/5 p-5">
      <section aria-labelledby="conflict-heading">
        <h2 id="conflict-heading" className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldAlert className="h-5 w-5 text-warning" aria-hidden /> Before you start: any
          conflict of interest?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You have a conflict if you, your firm or a relative has acted for the seller, a buyer or
          anyone claiming this land, or has an interest in it or in land next to it. Your checks
          unlock once you declare.
        </p>
        {declaring ? (
          <div className="mt-4 space-y-3">
            <Field
              label="Describe the conflict"
              htmlFor="conflict-note"
              hint="You will be withdrawn from this case and GetRentos will engage someone else."
            >
              <Textarea
                id="conflict-note"
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I surveyed this plot for the seller in 2024."
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                disabled={noteLength < 10 || isSaving}
                isLoading={isSaving}
                onClick={() => onDeclare('DECLARED', note)}
              >
                Declare conflict and step aside
              </Button>
              <Button variant="ghost" onClick={() => setDeclaring(false)} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => onDeclare('NONE')} isLoading={isSaving} disabled={isSaving}>
              I have no conflict
            </Button>
            <Button variant="outline" onClick={() => setDeclaring(true)} disabled={isSaving}>
              I have a conflict
            </Button>
          </div>
        )}
      </section>
    </Card>
  );
};
