'use client';

import { Heart, Bookmark, Download } from 'lucide-react';
import { Button } from '@sureground/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface SavedPropertiesHeaderProps {
  savedCount: number;
  wishlistCount: number;
  onExport?: () => void;
}

export const SavedPropertiesHeader = ({
  savedCount,
  wishlistCount,
  onExport,
}: SavedPropertiesHeaderProps) => {
  return (
    <div>
      <RenterPageHeader
        eyebrow=""
        icon={Heart}
        title="Saved properties"
        description="Organise favourite homes, compare your options, and return to promising listings quickly."
        actions={
          <>
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3">
              <Heart className="w-4 h-4 text-destructive" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">{savedCount}</span>
              <span className="text-xs text-muted-foreground">Saved</span>
            </div>

            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3">
              <Bookmark className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{wishlistCount}</span>
              <span className="text-xs text-muted-foreground">Wishlists</span>
            </div>

            {onExport && savedCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </Button>
            )}
          </>
        }
      />
    </div>
  );
};
