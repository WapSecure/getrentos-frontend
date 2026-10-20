'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, FileText } from 'lucide-react';
import { Alert, Badge, Checkbox } from '@getrentos/ui';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const defaultChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Government ID',
    description: 'Upload a valid government-issued ID',
    completed: false,
    required: true,
  },
  {
    id: '2',
    title: 'Proof of Income',
    description: 'Upload payslip or employment letter',
    completed: false,
    required: true,
  },
  {
    id: '3',
    title: 'Bank Statement',
    description: 'Upload last 3 months of bank statements',
    completed: false,
    required: true,
  },
  {
    id: '4',
    title: 'References',
    description: 'Add professional or personal references',
    completed: false,
    required: false,
  },
  {
    id: '5',
    title: 'Review Application',
    description: 'Review all details before submitting',
    completed: false,
    required: true,
  },
];

interface ApplicationChecklistProps {
  onComplete: (completed: boolean) => void;
}

export const ApplicationChecklist = ({ onComplete }: ApplicationChecklistProps) => {
  const [items, setItems] = useState(defaultChecklist);
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);
    const requiredCompleted = updated.filter((i) => i.required && i.completed).length;
    const requiredTotal = updated.filter((i) => i.required).length;
    onComplete(requiredCompleted === requiredTotal);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const requiredCompleted = items.filter((i) => i.required && i.completed).length;
  const requiredTotal = items.filter((i) => i.required).length;
  const isReady = requiredCompleted === requiredTotal;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex min-w-0 items-center gap-3">
          <FileCheck className="w-5 h-5 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Application Checklist</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} items completed
            </p>
          </div>
        </div>
        {isReady ? (
          <Badge variant="success">Ready to apply</Badge>
        ) : (
          <Badge variant="warning">
            {requiredCompleted}/{requiredTotal} required
          </Badge>
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 rounded-lg p-2 hover:bg-secondary"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
                className="flex-1"
                label={
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        item.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                      }
                    >
                      {item.title}
                    </span>
                    {item.required && (
                      <span className="text-xs font-normal text-destructive">Required</span>
                    )}
                  </span>
                }
                description={item.description}
              />
              {item.completed && <FileText className="w-4 h-4 text-success shrink-0" />}
            </motion.div>
          ))}

          {isReady ? (
            <Alert variant="success" className="mt-3">
              You&apos;re ready to apply! All required items are complete.
            </Alert>
          ) : (
            <Alert variant="warning" className="mt-3">
              Complete all required items before submitting your application.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
