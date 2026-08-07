'use client';

import { Shield, Lock, Star, Users, TrendingUp, Award, CheckCircle, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: 'Higher Visibility',
    description: 'Your listings and applications get priority',
    level: '70+',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Full escrow protection for all transactions',
    level: '60+',
  },
  {
    icon: Star,
    title: 'Trust Badge',
    description: 'Verified badge on your profile',
    level: '50+',
  },
  {
    icon: Users,
    title: 'More Trust',
    description: 'Landlords prefer high-trust renters',
    level: '75+',
  },
  {
    icon: TrendingUp,
    title: 'Better Offers',
    description: 'Access to premium property listings',
    level: '80+',
  },
  {
    icon: Award,
    title: 'Exclusive Benefits',
    description: 'Special promotions and offers',
    level: '85+',
  },
];

export const TrustScoreBenefits = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Trust Score Benefits</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Unlock more features with higher trust scores
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div
              key={index}
              className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="p-2 rounded-lg bg-[#c4a747]/10">
                <Icon className="w-4 h-4 text-[#c4a747]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {benefit.title}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                    {benefit.level}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{benefit.description}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
