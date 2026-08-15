'use client';

import { motion } from 'framer-motion';
import { Heart, Bookmark, Bell, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Properties</h1>
          <p className="text-muted-foreground mt-1">Track and manage your favorite properties</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
            <Heart className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium text-foreground">{savedCount}</span>
            <span className="text-xs text-gray-500">Saved</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
            <Bookmark className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{wishlistCount}</span>
            <span className="text-xs text-gray-500">Wishlists</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Bell className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 dark:text-green-400">Price Alerts On</span>
          </div>

          {onExport && savedCount > 0 && (
            <Button size="sm" variant="outline" onClick={onExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {savedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-3 rounded-lg bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 flex items-center gap-3"
        >
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">Insight:</span> You have {savedCount} saved properties.
            {savedCount >= 3
              ? ' Based on your saved items, we found 5 similar properties you might like.'
              : ' Save at least 3 properties to get personalized recommendations.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
