'use client';

import { useState } from 'react';
import { Clock, MessageSquarePlus } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { MusterRollEntry, MusterRollState } from '@/types/estate';

/**
 * The four things a marshal can say about one person.
 *
 * "Not yet accounted for" is on the list even though it is where everybody
 * starts, because a mistap has to be undoable — a roll that cannot be corrected
 * is one a marshal stops trusting. Note the wording: this is the marshal
 * speaking about somebody else, so it reads "Accounted for", never "safe".
 */
const STATE_ACTIONS: { state: MusterRollState; label: string; active: string }[] = [
  {
    state: 'ACCOUNTED',
    label: 'Accounted for',
    active: 'border-emerald-600 bg-emerald-600/10 text-foreground',
  },
  {
    state: 'NOT_ON_SITE',
    label: 'Not on site',
    active: 'border-primary bg-primary/10 text-foreground',
  },
  {
    state: 'NEEDS_HELP',
    label: 'Needs help',
    active: 'border-destructive bg-destructive/10 text-foreground',
  },
  {
    state: 'UNACCOUNTED',
    label: 'Not answered yet',
    active: 'border-border bg-secondary text-foreground',
  },
];

const stateTone: Record<MusterRollState, string> = {
  ACCOUNTED: 'text-emerald-600',
  NOT_ON_SITE: 'text-foreground',
  NEEDS_HELP: 'text-destructive',
  UNACCOUNTED: 'text-amber-600',
};

interface RollEntryRowProps {
  entry: MusterRollEntry;
  /** False once the muster is closed or timed out — a finished record stops moving. */
  rollOpen: boolean;
  isSaving: boolean;
  /** Answers for one person. Called with no note on a plain tap. */
  onAnswer: (entryId: string, state: MusterRollState, stateNote?: string) => void;
}

/**
 * One name on the roll.
 *
 * The tap records the answer on its own, with no note required, because a
 * marshal with a torch in one hand works in single taps. A note is available
 * underneath for the two answers that usually want one — "not on site" and
 * "needs help" — but it never stands between a marshal and recording that
 * somebody is out.
 *
 * `basisLabel` is the API's wording, not ours: it distinguishes a resident of
 * the estate from somebody who was inside when the alarm went, and from somebody
 * admitted *after* the roll was taken — a claim about where a person physically
 * was, which is not this screen's to guess at.
 */
export const RollEntryRow = ({ entry, rollOpen, isSaving, onAnswer }: RollEntryRowProps) => {
  const [isNoting, setIsNoting] = useState(false);
  const [note, setNote] = useState(entry.stateNote ?? '');

  const answered = entry.state !== 'UNACCOUNTED';

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{entry.personName}</p>
            <span className={`text-xs font-medium ${stateTone[entry.state]}`}>
              {entry.stateLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {entry.unitLabel} · {entry.basisLabel}
          </p>
          {entry.stateNote && (
            <p className="text-xs text-muted-foreground mt-1">Note: {entry.stateNote}</p>
          )}
          {answered && entry.stateAt && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Answered {new Date(entry.stateAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {rollOpen ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {STATE_ACTIONS.map((action) => {
              const isCurrent = entry.state === action.state;
              return (
                <button
                  key={action.state}
                  type="button"
                  aria-pressed={isCurrent}
                  disabled={isSaving}
                  onClick={() => {
                    // A tap that changes nothing is not sent: the API treats it as
                    // a decision, and the record of who answered this person would
                    // then name a marshal who did nothing.
                    if (isCurrent) return;
                    onAnswer(entry.id, action.state);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-60 ${
                    isCurrent ? action.active : 'border-border text-muted-foreground'
                  }`}
                >
                  {action.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setNote(entry.stateNote ?? '');
                setIsNoting((open) => !open);
              }}
              className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground inline-flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              {entry.stateNote ? 'Edit note' : 'Add a note'}
            </button>
          </div>

          {isNoting && (
            <div className="mt-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={
                  entry.state === 'NEEDS_HELP'
                    ? 'What is needed, and where they are'
                    : 'Why, or where they were reached'
                }
                className="w-full rounded-lg border border-border bg-transparent p-3 text-sm"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setIsNoting(false)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  disabled={isSaving}
                  onClick={() => {
                    // Saves the note against whatever the person is currently
                    // marked as, so adding a note can never silently re-answer them.
                    onAnswer(entry.id, entry.state, note.trim() || undefined);
                    setIsNoting(false);
                  }}
                >
                  Save note
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
