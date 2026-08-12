'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageCircle,
  FileText,
  CreditCard,
  Wrench,
  Home,
  Check,
} from 'lucide-react';
import { SaveButton } from '@/components/ui/SaveButton';
import { renterService } from '@/services/renterService';

interface NotificationPreference {
  id: string;
  category: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

const CATEGORY_META: { category: string; id: string; label: string; icon: React.ElementType }[] = [
  { category: 'application', id: 'applications', label: 'Application Updates', icon: FileText },
  { category: 'message', id: 'messages', label: 'Messages', icon: MessageCircle },
  { category: 'payment', id: 'payments', label: 'Payment Alerts', icon: CreditCard },
  { category: 'maintenance', id: 'maintenance', label: 'Maintenance Updates', icon: Wrench },
  { category: 'lease', id: 'lease', label: 'Lease Reminders', icon: Home },
  { category: 'system', id: 'system', label: 'System & Trust Score', icon: Bell },
];

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await renterService.listNotificationPreferences();
      if (res.success && res.data) {
        const byCategory = new Map(res.data.map((p) => [p.category, p]));
        setPreferences(
          CATEGORY_META.map((meta) => {
            const pref = byCategory.get(meta.category);
            const channels = {
              email: pref?.email ?? true,
              push: pref?.push ?? true,
              inApp: pref?.inApp ?? true,
            };
            return {
              id: meta.id,
              category: meta.category,
              label: meta.label,
              icon: meta.icon,
              enabled: channels.email || channels.push || channels.inApp,
              channels,
            };
          })
        );
      }
    };
    load();
  }, []);

  const togglePreference = async (id: string) => {
    const pref = preferences.find((p) => p.id === id);
    if (!pref) return;
    const enabled = !pref.enabled;
    const res = await renterService.updateNotificationPreference(pref.category, {
      email: enabled,
      push: enabled,
      inApp: enabled,
    });
    if (res.success && res.data) {
      const updated = res.data;
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                enabled,
                channels: { email: updated.email, push: updated.push, inApp: updated.inApp },
              }
            : p
        )
      );
    }
  };

  const toggleChannel = async (prefId: string, channel: 'email' | 'push' | 'inApp') => {
    const pref = preferences.find((p) => p.id === prefId);
    if (!pref) return;
    const res = await renterService.updateNotificationPreference(pref.category, {
      [channel]: !pref.channels[channel],
    });
    if (res.success && res.data) {
      const updated = res.data;
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === prefId
            ? { ...p, channels: { email: updated.email, push: updated.push, inApp: updated.inApp } }
            : p
        )
      );
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Notification Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage how and when you receive notifications
      </p>

      <div className="space-y-4">
        {preferences.map((pref) => {
          const Icon = pref.icon;
          return (
            <div key={pref.id} className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{pref.label}</h4>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference(pref.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pref.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pref.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {pref.enabled && (
                <div className="mt-3 pt-3 border-t border-border flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={pref.channels.email}
                      onChange={() => toggleChannel(pref.id, 'email')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={pref.channels.push}
                      onChange={() => toggleChannel(pref.id, 'push')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    Push
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={pref.channels.inApp}
                      onChange={() => toggleChannel(pref.id, 'inApp')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    In-App
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SaveButton label="Save Preferences" className="mt-4" />
    </div>
  );
};
