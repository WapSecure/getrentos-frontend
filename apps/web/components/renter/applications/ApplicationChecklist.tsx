'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle, FileCheck, FileText } from 'lucide-react';

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
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-[#c4a747]" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Application Checklist</h3>
            <p className="text-xs text-gray-500">
              {completedCount}/{totalCount} items completed
            </p>
          </div>
        </div>
        {isReady ? (
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
            Ready to apply
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 text-xs rounded-full">
            {requiredCompleted}/{requiredTotal} required
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c4a747] rounded-full transition-all duration-300"
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
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
              onClick={() => toggleItem(item.id)}
            >
              <button className="flex-shrink-0">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}
                  >
                    {item.title}
                  </p>
                  {item.required && <span className="text-xs text-red-500">Required</span>}
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              {item.completed && <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />}
            </motion.div>
          ))}

          {/* Status Message */}
          {isReady ? (
            <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ You&apos;re ready to apply! All required items are complete.
              </p>
            </div>
          ) : (
            <div className="mt-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Complete all required items before submitting your application.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
