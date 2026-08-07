'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, ChevronRight, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Recommendation {
  id: string;
  type: 'price_drop' | 'similar' | 'trending' | 'deadline';
  title: string;
  description: string;
  actionText: string;
  actionLink: string;
}

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    type: 'price_drop',
    title: 'Price Drop Alert',
    description: 'A similar property in your saved list dropped by 5%',
    actionText: 'View Similar',
    actionLink: '/renter/discover',
  },
  {
    id: '2',
    type: 'trending',
    title: 'Trending Now',
    description: 'Properties in Ikeja are getting 40% more views this week',
    actionText: 'Explore',
    actionLink: '/renter/discover',
  },
  {
    id: '3',
    type: 'deadline',
    title: 'Application Deadline',
    description: 'Modern Downtown Loft has received 20+ applications',
    actionText: 'Apply Now',
    actionLink: '/renter/properties/1/apply',
  },
];

export const SavedAIRecommendations = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden"
    >
      <div className="p-3 border-b border-purple-200 dark:border-purple-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
      </div>

      <div className="divide-y divide-purple-200 dark:divide-purple-800">
        {mockRecommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-3 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {rec.type === 'price_drop' && <TrendingDown className="w-3 h-3 text-green-600" />}
                  {rec.type === 'trending' && <TrendingUp className="w-3 h-3 text-blue-600" />}
                  {rec.type === 'deadline' && <Clock className="w-3 h-3 text-orange-600" />}
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{rec.description}</p>
              </div>
              <Button size="sm" variant="ghost" className="gap-0">
                {rec.actionText}
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
