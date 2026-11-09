'use client';

import { useState } from 'react';
import { Clock, MessageSquarePlus } from '@sureground/icons';
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  RadioGroup,
  type RadioOption,
  Textarea,
} from '@sureground/ui';
import type { MusterRollEntry, MusterRollState } from '@/types/estate';

// "Not yet accounted for" stays selectable so a mistap can be undone; the wording is "Accounted for", never "safe".
const STATE_ACTIONS: RadioOption<MusterRollState>[] = [
  { value: 'ACCOUNTED', label: 'Accounted for', tone: 'success' },
  { value: 'NOT_ON_SITE', label: 'Not on site', tone: 'primary' },
  { value: 'NEEDS_HELP', label: 'Needs help', tone: 'destructive' },
  { value: 'UNACCOUNTED', label: 'Not answered yet', tone: 'neutral' },
];

const stateTone: Record<MusterRollState, BadgeVariant> = {
  ACCOUNTED: 'success',
  NOT_ON_SITE: 'neutral',
  NEEDS_HELP: 'danger',
  UNACCOUNTED: 'warning',
};

interface RollEntryRowProps {
  entry: MusterRollEntry;
  rollOpen: boolean;
  isSaving: boolean;
  onAnswer: (entryId: string, state: MusterRollState, stateNote?: string) => Promise<boolean>;
}

export const RollEntryRow = ({ entry, rollOpen, isSaving, onAnswer }: RollEntryRowProps) => {
  const [isNoting, setIsNoting] = useState(false);
  const [note, setNote] = useState(entry.stateNote ?? '');

  const answered = entry.state !== 'UNACCOUNTED';

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{entry.personName}</p>
            <Badge variant={stateTone[entry.state]}>{entry.stateLabel}</Badge>
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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <RadioGroup
              // Each choice is saved at once: arrowing past an option must not send it.
              activation="manual"
              value={entry.state}
              onValueChange={(state) => {
                // A tap that changes nothing isn't sent: the API would record this marshal as having answered.
                if (state === entry.state) return;
                onAnswer(entry.id, state);
              }}
              options={STATE_ACTIONS}
              orientation="horizontal"
              disabled={isSaving}
              aria-label={`Answer for ${entry.personName}`}
            />

            <Button
              variant="ghost"
              size="sm"
              icon={<MessageSquarePlus className="w-3.5 h-3.5" />}
              onClick={() => {
                setNote(entry.stateNote ?? '');
                setIsNoting((open) => !open);
              }}
            >
              {entry.stateNote ? 'Edit note' : 'Add a note'}
            </Button>
          </div>

          {isNoting && (
            <div className="mt-3">
              <Textarea
                aria-label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={
                  entry.state === 'NEEDS_HELP'
                    ? 'What is needed, and where they are'
                    : 'Why, or where they were reached'
                }
                showCount
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setIsNoting(false)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  isLoading={isSaving}
                  onClick={async () => {
                    // Saves against the current answer, so adding a note never re-answers the person.
                    const saved = await onAnswer(entry.id, entry.state, note.trim() || undefined);
                    if (saved) setIsNoting(false);
                  }}
                >
                  Save note
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
};
