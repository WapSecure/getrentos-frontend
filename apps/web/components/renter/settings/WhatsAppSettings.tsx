'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { MessageCircle, CheckCircle2, Smartphone, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { WhatsAppConnectionStatus, WhatsAppNotificationPreference } from '@/types/whatsapp';

const initialPreferences: WhatsAppNotificationPreference[] = [
  { id: 'payments', label: 'Rent & Flex Payment Reminders', enabled: true },
  { id: 'maintenance', label: 'Maintenance Updates', enabled: true },
  { id: 'messages', label: 'New Messages from Landlord', enabled: true },
  { id: 'lease', label: 'Lease Renewal Alerts', enabled: true },
  { id: 'credit', label: 'Credit Reporting Confirmations', enabled: false },
];

export const WhatsAppSettings = () => {
  const [status, setStatus] = useState<WhatsAppConnectionStatus>('disconnected');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [preferences, setPreferences] = useState(initialPreferences);

  const handleSendCode = () => {
    if (!phone.trim()) return;
    setIsSending(true);
    window.setTimeout(() => {
      setIsSending(false);
      setStatus('awaiting_code');
    }, 1000);
  };

  const handleVerify = () => {
    if (code !== '123456') {
      setCodeError(true);
      return;
    }
    setCodeError(false);
    setStatus('connected');
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
    setPhone('');
    setCode('');
  };

  const togglePreference = (id: string) => {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">WhatsApp Notifications</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Get rent reminders, maintenance updates, and messages on WhatsApp instead of relying on
        email or push alerts.
      </p>

      {status === 'disconnected' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary">
            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              Connect your WhatsApp number to start receiving notifications there. You can switch it
              off at any time.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              WhatsApp Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <LegacyInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 000 0000"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <Button variant="primary" onClick={handleSendCode} disabled={!phone.trim() || isSending}>
            {isSending ? 'Sending Code...' : 'Send Verification Code'}
          </Button>
        </div>
      )}

      {status === 'awaiting_code' && (
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            We sent a code to <span className="font-medium">{phone}</span> on WhatsApp.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Verification Code
            </label>
            <LegacyInput
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError(false);
              }}
              placeholder="123456"
              maxLength={6}
              className={`w-full px-3 py-2 rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                codeError ? 'border-destructive' : 'border-border'
              }`}
            />
            {codeError && (
              <p className="text-xs text-destructive mt-1">Incorrect code. Try 123456.</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Use 123456 for this demo.</p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStatus('disconnected')}>
              Change Number
            </Button>
            <Button variant="primary" onClick={handleVerify} disabled={code.length < 6}>
              Verify
            </Button>
          </div>
        </div>
      )}

      {status === 'connected' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{phone}</p>
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">Send to WhatsApp</p>
            <div className="space-y-2">
              {preferences.map((pref) => (
                <div
                  key={pref.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <span className="text-sm text-foreground">{pref.label}</span>
                  <Toggle checked={pref.enabled} onChange={() => togglePreference(pref.id)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">Preview</p>
            <div className="max-w-xs rounded-2xl rounded-tl-sm bg-green-100 dark:bg-green-900/30 p-3">
              <p className="text-sm text-green-900 dark:text-green-200">
                Hi David 👋 This is a reminder that your rent installment of ₦228,000 is due
                tomorrow. Reply PAY to settle it now.
              </p>
              <p className="text-[10px] text-green-700/70 dark:text-green-400/70 mt-1 flex items-center gap-1 justify-end">
                GetRentos <Check className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
      checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
