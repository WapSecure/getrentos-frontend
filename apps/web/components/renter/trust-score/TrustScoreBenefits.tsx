'use client';

import {
  Shield,
  Lock,
  Star,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  BadgeCheck,
} from 'lucide-react';
import { Badge, Card } from '@getrentos/ui';

const benefits = [
  {
    icon: Shield,
    title: 'Higher visibility',
    description: 'Your listings and applications get priority',
    level: '70+',
  },
  {
    icon: Lock,
    title: 'Payment Protection',
    description: 'GetRentos holds your rent and deposits, and a dispute keeps them held',
    level: '60+',
  },
  {
    icon: Star,
    title: 'Trust badge',
    description: 'Verified badge on your profile',
    level: '50+',
  },
  {
    icon: Users,
    title: 'More trust',
    description: 'Landlords prefer high-trust renters',
    level: '75+',
  },
  {
    icon: TrendingUp,
    title: 'Better offers',
    description: 'Access to premium property listings',
    level: '80+',
  },
  {
    icon: Award,
    title: 'Exclusive benefits',
    description: 'Special promotions and offers',
    level: '85+',
  },
];

export const TrustScoreBenefits = () => {
  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Trust score benefits</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Unlock more features with higher trust scores
        </p>
      </div>

      <div className="divide-y divide-border">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div
              key={index}
              className="p-3 flex items-center gap-3 hover:bg-secondary transition-colors"
            >
              <div className="p-2 rounded-lg bg-accent">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{benefit.title}</p>
                  <Badge variant="info">{benefit.level}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-muted-foreground/50" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};
