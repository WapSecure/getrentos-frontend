'use client';

import { Tag } from 'lucide-react';

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

export const MessageLabels = ({ labels, onSelectLabel, selectedLabel }: MessageLabelsProps) => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Labels</span>
        </div>
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
      </div>
    </div>
  );
};
