'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle, Camera, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const checklistItems: ChecklistItem[] = [
  {
    id: '1',
    title: 'Document Property Condition',
    description: 'Take photos of each room',
    completed: false,
    required: true,
  },
  {
    id: '2',
    title: 'Note Existing Damages',
    description: 'Document any pre-existing issues',
    completed: false,
    required: true,
  },
  {
    id: '3',
    title: 'Test Appliances',
    description: 'Ensure all appliances work',
    completed: true,
    required: false,
  },
  {
    id: '4',
    title: 'Check Utilities',
    description: 'Verify water, electricity, internet',
    completed: false,
    required: true,
  },
  {
    id: '5',
    title: 'Review Lease Terms',
    description: 'Confirm move-in date and conditions',
    completed: false,
    required: true,
  },
];

export const RenterMoveInChecklist = () => {
  const [items, setItems] = useState(checklistItems);
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.4 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Move-In Checklist</h2>
            <p className="text-sm text-muted-foreground">Complete these steps before moving in</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-primary">
              {completedCount}/{totalCount}
            </span>
            <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            onClick={() => toggleItem(item.id)}
          >
            <button className="mt-0.5">
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-foreground'}`}
                >
                  {item.title}
                </p>
                {item.required && <span className="text-xs text-red-500">Required</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            </div>
            {item.title === 'Document Property Condition' && (
              <Button size="sm" variant="ghost" className="gap-1">
                <Camera className="w-3 h-3" />
                Upload
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <Button variant="primary" fullWidth className="gap-2">
          <FileText className="w-4 h-4" />
          Generate Move-In Report
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          This report will be shared with your landlord
        </p>
      </div>
    </motion.div>
  );
};
