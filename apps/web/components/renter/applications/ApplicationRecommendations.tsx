'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Application } from '@/types/renter';

interface ApplicationRecommendationsProps {
  applications: Application[];
}

export const ApplicationRecommendations = ({ applications }: ApplicationRecommendationsProps) => {
  // Mock recommendations based on applications
  const getRecommendations = () => {
    const approved = applications.filter((a) => a.status === 'approved');
    const pending = applications.filter(
      (a) => a.status === 'pending' || a.status === 'under_review'
    );

    if (approved.length === 0 && applications.length === 0) {
      return [
        {
          id: '1',
          title: 'Complete Your Profile',
          description: 'A complete profile increases approval chances by 40%',
          action: 'Update Profile',
        },
        {
          id: '2',
          title: 'Upload Required Documents',
          description: 'Ensure all documents are uploaded before applying',
          action: 'View Checklist',
        },
      ];
    }

    if (pending.length > 0) {
      return [
        {
          id: '1',
          title: 'Follow Up on Pending Applications',
          description: `You have ${pending.length} application${pending.length > 1 ? 's' : ''} pending review`,
          action: 'View Applications',
        },
        {
          id: '2',
          title: 'Explore Similar Properties',
          description: "Find more properties like ones you've applied to",
          action: 'Discover',
        },
      ];
    }

    return [
      {
        id: '1',
        title: "You're on a Roll!",
        description: "You've been approved for multiple properties. Time to decide!",
        action: 'View Approved',
      },
      {
        id: '2',
        title: 'Share Your Experience',
        description: "Help other renters by reviewing properties you've visited",
        action: 'Write Review',
      },
    ];
  };

  const recommendations = getRecommendations();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-foreground">AI Recommendations</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-secondary transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">{rec.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{rec.description}</p>
              </div>
              <Button size="sm" variant="ghost" className="gap-0 shrink-0">
                {rec.action}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
