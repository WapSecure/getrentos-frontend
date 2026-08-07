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
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Trust Score Tips</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Daily tips to improve your score
        </p>
      </div>

      <div className="p-4 space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#c4a747] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
