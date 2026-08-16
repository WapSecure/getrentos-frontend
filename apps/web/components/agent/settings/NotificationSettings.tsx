'use client';

import { useState } from 'react';
import { ClipboardList, AlertTriangle, RefreshCw, MessageCircle, Star } from 'lucide-react';
import { SaveButton } from '@getrentos/ui';

interface NotificationPreference {
  id: string;
  label: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
}

const initialPreferences: NotificationPreference[] = [
  { id: 'tasks', label: 'New Task Assignments', icon: ClipboardList, email: true, push: true },
  { id: 'overdue', label: 'Overdue Task Alerts', icon: AlertTriangle, email: true, push: true },
  { id: 'sync', label: 'Sync Status Updates', icon: RefreshCw, email: false, push: true },
  { id: 'messages', label: 'New Messages', icon: MessageCircle, email: true, push: false },
  { id: 'reviews', label: 'New Reviews', icon: Star, email: false, push: false },
];

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState(initialPreferences);

  const toggle = (id: string, channel: 'email' | 'push') => {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p)));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Notifications</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose what you want to be notified about
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-end gap-8 pr-2 text-xs font-medium text-muted-foreground">
          <span className="w-11 text-center">Email</span>
          <span className="w-11 text-center">Push</span>
        </div>
        {preferences.map((pref) => (
          <div
            key={pref.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border"
          >
            <div className="flex items-center gap-3">
              <pref.icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-foreground">{pref.label}</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="w-10 flex justify-center">
                <Toggle checked={pref.email} onChange={() => toggle(pref.id, 'email')} />
              </div>
              <div className="w-10 flex justify-center">
                <Toggle checked={pref.push} onChange={() => toggle(pref.id, 'push')} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveButton label="Save Preferences" className="mt-6" />
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
