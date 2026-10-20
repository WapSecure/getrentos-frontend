'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Alert, Checkbox } from '@getrentos/ui';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const defaultChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Check if issue is urgent',
    description: 'Assess if this requires immediate attention',
    completed: false,
  },
  {
    id: '2',
    title: 'Take clear photos',
    description: 'Document the issue with photos',
    completed: false,
  },
  {
    id: '3',
    title: 'Check circuit breakers',
    description: 'For electrical issues, check breakers first',
    completed: false,
  },
  {
    id: '4',
    title: 'Turn off water supply',
    description: 'For plumbing issues, shut off water if needed',
    completed: false,
  },
  {
    id: '5',
    title: 'Note appliance details',
    description: 'Record make, model, and serial numbers',
    completed: false,
  },
];

export const MaintenanceChecklist = () => {
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
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Maintenance Checklist</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} items completed
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{isExpanded ? 'Hide' : 'Show'}</span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          <div className="mb-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
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
              className="p-2 rounded-lg hover:bg-secondary"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
                label={
                  <span className={item.completed ? 'text-muted-foreground line-through' : undefined}>
                    {item.title}
                  </span>
                }
                description={item.description}
              />
            </motion.div>
          ))}

          <Alert variant="info" className="mt-2">
            💡 Tip: Having photos ready helps vendors diagnose issues faster
          </Alert>
        </div>
      )}
    </motion.div>
  );
};
