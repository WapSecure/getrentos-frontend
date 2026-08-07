'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, FileText, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const defaultChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Clean all rooms thoroughly',
    description: 'Deep clean kitchen, bathrooms, and living areas',
    completed: false,
  },
  {
    id: '2',
    title: 'Document property condition',
    description: 'Take photos of each room for records',
    completed: false,
  },
  {
    id: '3',
    title: 'Repair any damages',
    description: 'Fix holes, scratches, or other damages',
    completed: false,
  },
  {
    id: '4',
    title: 'Return all keys',
    description: 'Return keys to landlord or property manager',
    completed: false,
  },
  {
    id: '5',
    title: 'Forward mail',
    description: 'Update address for mail forwarding',
    completed: false,
  },
];

export const LeaseMoveOutChecklist = () => {
  const [items, setItems] = useState(defaultChecklist);
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#c4a747]" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Move-Out Checklist</h3>
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
                className="h-full bg-[#c4a747] rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
              onClick={() => toggleItem(item.id)}
            >
              <button className="mt-1 flex-shrink-0">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <div>
                <p
                  className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </motion.div>
          ))}

          <Button variant="outline" fullWidth size="sm" className="mt-2 gap-2">
            <Camera className="w-4 h-4" />
            Document Condition
          </Button>
        </div>
      )}
    </motion.div>
  );
};
