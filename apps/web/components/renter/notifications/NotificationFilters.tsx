'use client';

import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface NotificationFiltersProps {
  filterType: string;
  setFilterType: (type: string) => void;
  filterRead: string;
  setFilterRead: (read: string) => void;
}

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'application', label: 'Applications' },
  { value: 'message', label: 'Messages' },
  { value: 'payment', label: 'Payments' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lease', label: 'Lease' },
  { value: 'system', label: 'System' },
];

const readOptions = [
  { value: 'all', label: 'All' },
  { value: 'read', label: 'Read' },
  { value: 'unread', label: 'Unread' },
];

export const NotificationFilters = ({
  filterType,
  setFilterType,
  filterRead,
  setFilterRead,
}: NotificationFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {(filterType !== 'all' || filterRead !== 'all') && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Notification Type
            </label>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filterType === option.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilterType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Status</label>
            <div className="flex flex-wrap gap-2">
              {readOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filterRead === option.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilterRead(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
