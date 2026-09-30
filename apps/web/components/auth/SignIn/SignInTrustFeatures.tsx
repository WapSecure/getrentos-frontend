'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, TrendingUp } from 'lucide-react';

const trustFeatures = [
  {
    icon: Shield,
    title: 'Identity-verified listings',
    description: 'Every property and user is verified',
  },
  {
    icon: Lock,
    title: 'Protected payments',
    description: 'Your funds are always secure',
  },
  {
    icon: CheckCircle,
    title: 'Real-time application tracking',
    description: 'Know your status instantly',
  },
  {
    icon: TrendingUp,
    title: 'Transparent trust scores',
    description: 'Build and see your reputation grow',
  },
];

export const SignInTrustFeatures = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {trustFeatures.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-3.5 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <feature.icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
            <p className="text-xs leading-5 text-muted-foreground">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
