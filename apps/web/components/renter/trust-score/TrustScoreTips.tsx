'use client';

import { Lightbulb, Sparkles } from 'lucide-react';

const tips = [
  'Complete all verifications to maximize your trust score',
  'Add references from previous landlords for bonus points',
  'Be responsive to messages - response rate affects your score',
  'Maintain a positive rating history with landlords',
  'Update your profile information regularly',
];

export const TrustScoreTips = () => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Trust Score Tips</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Daily tips to improve your score</p>
      </div>

      <div className="p-4 space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
