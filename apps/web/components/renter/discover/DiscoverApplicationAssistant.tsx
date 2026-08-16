'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export const DiscoverApplicationAssistant = () => {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: renterKeys.applicationAssistant,
    queryFn: () => unwrap(renterService.getApplicationAssistant()),
  });

  const steps = data?.steps ?? [];
  const suggestion = data?.suggestion ?? null;
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = totalSteps ? (completedCount / totalSteps) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Application Assistant</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Get personalized help with your rental applications
        </p>
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your application status…</p>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Application Readiness</span>
                <span>
                  {completedCount}/{totalSteps} steps completed
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="shrink-0">
                    {step.status === 'completed' && (
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                    )}
                    {step.status === 'in_progress' && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-blue-600" />
                      </div>
                    )}
                    {step.status === 'pending' && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        step.status === 'completed'
                          ? 'text-gray-500 line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {suggestion && (
              <div className="p-3 rounded-lg bg-linear-to-r from-primary/10 to-transparent border border-primary/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Suggestion</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{suggestion}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              className="mt-4 gap-1"
              onClick={() => router.push('/renter/applications')}
            >
              Continue Application
              <ArrowRight className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
};
