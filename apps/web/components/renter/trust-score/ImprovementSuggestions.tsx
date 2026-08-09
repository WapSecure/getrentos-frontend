'use client';

import { Sparkles, User, Phone, FileText, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const suggestions = [
  {
    id: '1',
    icon: User,
    title: 'Complete Identity Verification',
    description: 'Verify your identity to increase trust by 15 points',
    priority: 'high',
  },
  {
    id: '2',
    icon: Phone,
    title: 'Verify Your Phone Number',
    description: 'Add and verify your phone number for +10 points',
    priority: 'high',
  },
  {
    id: '3',
    icon: FileText,
    title: 'Add Property Verification',
    description: 'Verify your property to gain +20 trust points',
    priority: 'medium',
  },
  {
    id: '4',
    icon: Users,
    title: 'Add References',
    description: 'Add landlord references for +5 points each',
    priority: 'medium',
  },
];

export const ImprovementSuggestions = () => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Improve Your Score</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Complete these actions to increase your trust score
        </p>
      </div>

      <div className="divide-y divide-border">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <div key={suggestion.id} className="p-4 hover:bg-secondary transition-colors">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    suggestion.priority === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : suggestion.priority === 'medium'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      suggestion.priority === 'high'
                        ? 'text-red-600'
                        : suggestion.priority === 'medium'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        suggestion.priority === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : suggestion.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}
                    >
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-0">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
