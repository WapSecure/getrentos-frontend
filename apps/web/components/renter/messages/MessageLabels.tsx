'use client';

import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Label {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface MessageLabelsProps {
  labels: Label[];
  onSelectLabel: (labelId: string) => void;
  selectedLabel: string | null;
}

const defaultColors = [
  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
];

export const MessageLabels = ({ labels, onSelectLabel, selectedLabel }: MessageLabelsProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    // In production, add to database
    console.log('Adding label:', newLabelName, 'with color:', selectedColor);
    setNewLabelName('');
    setIsAdding(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Labels</span>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="p-1 rounded hover:bg-secondary">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {/* All Labels Option */}
        <button
          onClick={() => onSelectLabel('all')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedLabel === 'all'
              ? 'bg-accent text-primary'
              : 'hover:bg-secondary text-foreground'
          }`}
        >
          <span>All Conversations</span>
          <span className="text-xs text-gray-500">
            {labels.reduce((sum, l) => sum + l.count, 0)}
          </span>
        </button>

        {labels.map((label) => (
          <button
            key={label.id}
            onClick={() => onSelectLabel(label.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedLabel === label.id
                ? 'bg-accent text-primary'
                : 'hover:bg-secondary text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${label.color.split(' ')[0]}`} />
              <span>{label.name}</span>
            </div>
            <span className="text-xs text-gray-500">{label.count}</span>
          </button>
        ))}

        {/* Add Label Form */}
        {isAdding && (
          <div className="p-2 mt-2 border-t border-border space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="sm" onClick={handleAddLabel} disabled={!newLabelName.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    selectedColor === color ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <div className={`w-full h-full rounded-full ${color.split(' ')[0]}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
