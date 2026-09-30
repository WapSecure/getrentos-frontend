'use client';

import { motion } from 'framer-motion';
import { Heart, Bookmark, Download, BadgeCheck } from 'lucide-react';
import { Button } from '@getrentos/ui';
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <RenterPageHeader
        eyebrow="Your shortlist"
        icon={Heart}
        title="Saved properties"
        description="Organise favourite homes, compare your options, and return to promising listings quickly."
        actions={
          <>
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-foreground">{savedCount}</span>
              <span className="text-xs text-muted-foreground">Saved</span>
            </div>

            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3">
              <Bookmark className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{wishlistCount}</span>
              <span className="text-xs text-muted-foreground">Wishlists</span>
            </div>

            {onExport && savedCount > 0 && (
              <Button size="sm" variant="outline" onClick={onExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
          </>
        }
      >
        {savedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5"
          >
            <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Insight:</span> You have {savedCount} saved
              properties.
              {savedCount >= 3
                ? ' Based on your saved items, we found 5 similar properties you might like.'
                : ' Save at least 3 properties to get personalized recommendations.'}
            </p>
          </motion.div>
        )}
      </RenterPageHeader>
    </motion.div>
  );
};
