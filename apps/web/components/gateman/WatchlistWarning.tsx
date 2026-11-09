'use client';

import { Eye } from '@sureground/icons';
import { Alert } from '@sureground/ui';

// Shown after a successful write: a WATCH entry admits the visitor on purpose, so this is deliberately not an error.
export const WatchlistWarning = ({ warning }: { warning?: string }) => {
  if (!warning) return null;

  return (
    <Alert variant="warning" icon={Eye} title="On the estate’s watch list">
      <p className="text-xs">{warning}</p>
    </Alert>
  );
};
