import { Sheet } from '@/components/Sheet';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import type { WatchlistMatch } from '@/lib/gateman/watchlistRefusal';

export interface WatchlistBlockedSheetProps {
  open: boolean;
  onClose: () => void;
  /** What the API said. Rendered verbatim. */
  message: string;
  /** The entries that fired. */
  matches: WatchlistMatch[];
  onOverride: (reason: string) => void;
  isOverriding?: boolean;
  /** A failure of the override attempt itself, shown without losing the reason typed. */
  error?: string | null;
}

/**
 * The watchlist refusal, held on screen at the gate.
 *
 * A sheet rather than a card because the notice can appear from anywhere on the
 * console — a check-in, admitting an approved walk-in — and it has to be read
 * and answered, not scrolled past. The refusal itself is
 * `WatchlistBlockedNotice`, shared with the walk-in sheet so a guard sees the
 * same thing whichever route they took to it.
 *
 * No footer: the notice owns its own actions, and keeping them next to the
 * reason field means the keyboard cannot cover the button that uses what was
 * typed.
 */
export function WatchlistBlockedSheet({
  open,
  onClose,
  message,
  matches,
  onOverride,
  isOverriding,
  error,
}: WatchlistBlockedSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Visitor refused" snapPoints={['80%']}>
      <WatchlistBlockedNotice
        message={message}
        matches={matches}
        onOverride={onOverride}
        isOverriding={isOverriding}
        error={error}
      />
    </Sheet>
  );
}
