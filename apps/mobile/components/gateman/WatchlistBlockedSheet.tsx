import { Sheet } from '@/components/Sheet';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import type { WatchlistMatch } from '@/lib/gateman/watchlistRefusal';

export interface WatchlistBlockedSheetProps {
  open: boolean;
  onClose: () => void;
  message: string;
  matches: WatchlistMatch[];
  onOverride: (reason: string) => void;
  isOverriding?: boolean;
  error?: string | null;
}

// No footer: the notice owns its actions, and keeping them by the reason field stops the keyboard covering the button.
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
