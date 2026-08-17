'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, FileText, Camera } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { printHtml, escapeHtml } from '@/lib/export';

export const LeaseMoveOutChecklist = () => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: items = [] } = useQuery({
    queryKey: renterKeys.moveOutChecklist,
    queryFn: () => unwrap(renterService.getMoveOutChecklist()),
  });

  const toggleMutation = useMutation({
    mutationFn: (key: string) => unwrap(renterService.toggleMoveOutChecklistItem(key)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: renterKeys.moveOutChecklist }),
  });

  const toggleItem = (key: string) => {
    toggleMutation.mutate(key);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  const handleDocumentCondition = () => {
    const date = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const rows = items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.description)}</td><td>${
            item.completed ? 'Done' : 'Pending'
          }</td></tr>`
      )
      .join('');
    printHtml(
      'Move-Out Condition Report',
      `<h1>Move-Out Condition Report</h1>
       <p class="meta">Generated ${date} · ${completedCount}/${totalCount} items completed</p>
       <h2>Checklist Status</h2>
       <table><thead><tr><th>Item</th><th>Description</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Move-Out Checklist</h3>
            <p className="text-xs text-gray-500">
              {completedCount}/{totalCount} items completed
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-500">{isExpanded ? 'Hide' : 'Show'}</span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          <div className="mb-3">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {items.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
              onClick={() => toggleItem(item.key)}
            >
              <button className="mt-1 shrink-0">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <div>
                <p
                  className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-foreground'}`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </motion.div>
          ))}

          <Button
            variant="outline"
            fullWidth
            size="sm"
            className="mt-2 gap-2"
            onClick={handleDocumentCondition}
          >
            <Camera className="w-4 h-4" />
            Document Condition
          </Button>
        </div>
      )}
    </motion.div>
  );
};
