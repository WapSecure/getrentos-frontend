'use client';

import { useState } from 'react';
import { Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Field, Select, Switch } from '@getrentos/ui';

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
    <Card>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <Volume2 className="w-4 h-4 text-primary" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Notification Sound</h3>
            <p className="text-xs text-muted-foreground">Play sound for new notifications</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          <Switch label="Sound Enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />

          {isEnabled && (
            <Field label="Sound Type">
              <Select
                value={selectedSound}
                onValueChange={setSelectedSound}
                options={soundOptions}
              />
            </Field>
          )}
        </div>
      )}
    </Card>
  );
};
