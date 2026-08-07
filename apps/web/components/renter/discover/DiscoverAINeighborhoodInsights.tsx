'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Wifi,
  Car,
  Coffee,
  School,
  Hospital,
  ShoppingBag,
  Trees,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react';

interface NeighborhoodMetric {
  icon: React.ElementType;
  label: string;
  score: number;
  description: string;
}

const metrics: NeighborhoodMetric[] = [
  { icon: Wifi, label: 'Internet Speed', score: 85, description: 'High-speed fiber available' },
  {
    icon: Car,
    label: 'Traffic Score',
    score: 72,
    description: 'Moderate congestion during peak hours',
  },
  {
    icon: Coffee,
    label: 'Amenities',
    score: 90,
    description: 'Restaurants, cafes, and shops nearby',
  },
  { icon: School, label: 'Education', score: 88, description: 'Top-rated schools in district' },
  { icon: Hospital, label: 'Healthcare', score: 82, description: 'Hospital within 2km' },
  { icon: ShoppingBag, label: 'Shopping', score: 92, description: 'Multiple malls and markets' },
  { icon: Trees, label: 'Green Space', score: 75, description: 'Parks and recreational areas' },
  { icon: Users, label: 'Community', score: 78, description: 'Family-friendly neighborhood' },
];

export const DiscoverAINeighborhoodInsights = () => {
  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden mb-6"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#c4a747]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              AI Neighborhood Insights
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Overall Score</p>
              <p className="text-xl font-bold text-[#c4a747]">{overallScore}</p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  className="dark:stroke-gray-700"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#c4a747"
                  strokeWidth="4"
                  strokeDasharray={`${(overallScore / 100) * 125.6} 125.6`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#c4a747]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.03 }}
              className="p-2 rounded-lg bg-gray-50 dark:bg-white/5"
            >
              <div className="flex items-center gap-2 mb-1">
                <metric.icon className="w-3 h-3 text-[#c4a747]" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {metric.score}
                </span>
                <span className="text-xs text-gray-500">
                  {metric.score >= 80 ? 'Excellent' : metric.score >= 60 ? 'Good' : 'Average'}
                </span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#c4a747] rounded-full"
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">AI Insight</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                This neighborhood scores high on amenities and education. Property values have
                increased 12% in the last year.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
