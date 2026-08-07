'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  ChevronRight,
  Star,
  MapPin,
  Bed,
  Bath,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface AIRecommendation {
  id: string;
  type: 'property' | 'tip' | 'alert';
  title: string;
  description: string;
  confidence: number;
  action?: string;
}

const mockRecommendations: AIRecommendation[] = [
  {
    id: '1',
    type: 'property',
    title: 'Perfect Match for You',
    description:
      'Based on your search history, this 2-bed apartment in Ikeja matches 94% of your preferences',
    confidence: 94,
    action: 'View Property',
  },
  {
    id: '2',
    type: 'tip',
    title: 'Price Drop Alert',
    description:
      'Properties in Lekki Phase 1 have dropped by 8% this week. Great time to book viewings!',
    confidence: 87,
    action: 'Explore Listings',
  },
  {
    id: '3',
    type: 'alert',
    title: 'Application Deadline Approaching',
    description: 'The Modern Downtown Loft has received 15 applications. Apply within 48 hours!',
    confidence: 92,
    action: 'Apply Now',
  },
];

export const DiscoverAIRecommendations = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'property':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/20',
          icon: 'text-purple-600',
          border: 'border-purple-200 dark:border-purple-800',
        };
      case 'tip':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          icon: 'text-blue-600',
          border: 'border-blue-200 dark:border-blue-800',
        };
      case 'alert':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/20',
          icon: 'text-orange-600',
          border: 'border-orange-200 dark:border-orange-800',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-white/5',
          icon: 'text-gray-600',
          border: 'border-gray-200',
        };
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="bg-gradient-to-r from-[#c4a747]/10 to-transparent rounded-xl border border-[#c4a747]/20 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c4a747]/20">
              <Brain className="w-5 h-5 text-[#c4a747]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI-Powered Recommendations
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personalized insights based on your activity
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 space-y-3">
            {mockRecommendations.map((rec, index) => {
              const styles = getTypeStyles(rec.type);
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${styles.border} ${styles.bg}`}
                >
                  <div className={`p-1.5 rounded-lg ${styles.bg}`}>
                    {rec.type === 'property' && <Sparkles className={`w-4 h-4 ${styles.icon}`} />}
                    {rec.type === 'tip' && <TrendingUp className={`w-4 h-4 ${styles.icon}`} />}
                    {rec.type === 'alert' && <Shield className={`w-4 h-4 ${styles.icon}`} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {rec.title}
                      </h4>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                        {rec.confidence}% match
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {rec.description}
                    </p>
                    {rec.action && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 p-0 h-auto text-xs text-[#c4a747]"
                      >
                        {rec.action} <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
