'use client';

import { Sparkles } from 'lucide-react';
import { Alert } from './Alert';
import { Button } from './Button';

export interface SuggestedDraftProps {
  /** The drafted text. */
  text: string;
  title?: string;
  /** Points to confirm before sending. */
  toCheck?: string[];
  /** What the draft was written from, in titled groups of lines. */
  sources?: { title: string; lines: string[] }[];
  sourcesLabel?: string;
  disclaimer?: string;
  useLabel?: string;
  onUse: (text: string) => void;
  onDismiss?: () => void;
}

/**
 * A drafted piece of text for the person to read, use and edit before
 * sending: the draft, what to check first, and what it was written from.
 * Nothing is sent from here.
 */
export function SuggestedDraft({
  text,
  title = 'Suggested reply',
  toCheck = [],
  sources = [],
  sourcesLabel = 'What it was written from',
  disclaimer,
  useLabel = 'Use this draft',
  onUse,
  onDismiss,
}: SuggestedDraftProps) {
  return (
    <section className="mt-3 space-y-3 rounded-lg border border-border p-3 text-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="whitespace-pre-wrap text-foreground">{text}</p>

      {toCheck.length > 0 && (
        <Alert variant="warning" title="Check before sending">
          <ul className="list-disc space-y-0.5 pl-4">
            {toCheck.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Alert>
      )}

      {sources.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">{sourcesLabel}</summary>
          <div className="mt-2 space-y-2">
            {sources.map((s) => (
              <div key={s.title}>
                <p className="font-medium text-foreground">{s.title}</p>
                <ul className="space-y-0.5">
                  {s.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onUse(text)}>
          {useLabel}
        </Button>
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
      {disclaimer && <p className="text-2xs text-muted-foreground">{disclaimer}</p>}
    </section>
  );
}
