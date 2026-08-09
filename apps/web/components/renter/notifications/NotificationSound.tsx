'use client';

import { useState } from 'react';
import { Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotificationSound = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('default');
  const [isExpanded, setIsExpanded] = useState(true);

  const soundOptions = [
    { value: 'default', label: 'Default' },
    { value: 'gentle', label: 'Gentle' },
    { value: 'crisp', label: 'Crisp' },
    { value: 'none', label: 'None' },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <Volume2 className="w-4 h-4 text-primary" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-400" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Notification Sound</h3>
            <p className="text-xs text-gray-500">Play sound for new notifications</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Sound Enabled</span>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isEnabled && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Sound Type</label>
              <select
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {soundOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
