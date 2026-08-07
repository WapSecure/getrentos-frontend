'use client';

import { useState } from 'react';
import { Shield, Fingerprint, Smartphone, Key, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const SecuritySettings = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Security Settings
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage your account security and authentication methods
      </p>

      <div className="space-y-6">
        {/* Two-Factor Authentication */}
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Choose your 2FA method:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Key className="w-4 h-4" />
                  Authenticator App
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Smartphone className="w-4 h-4" />
                  SMS
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Biometric
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Biometric Authentication */}
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Fingerprint className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Biometric Authentication
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use fingerprint or face recognition
                </p>
              </div>
            </div>
            <button
              onClick={() => setBiometricEnabled(!biometricEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                biometricEnabled ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Session Management */}
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Active Sessions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your active sessions
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Chrome on MacOS</p>
                <p className="text-xs text-gray-500">Current session • 2024-06-18 10:30</p>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                Terminate
              </Button>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Safari on iPhone
                </p>
                <p className="text-xs text-gray-500">2024-06-17 14:20</p>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                Terminate
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3 text-red-500 hover:text-red-700">
            Terminate All Sessions
          </Button>
        </div>

        {/* Login History */}
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Recent Login Activity</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monitor account access</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Successful login
                </p>
                <p className="text-xs text-gray-500">2024-06-18 10:30 • Chrome on MacOS</p>
              </div>
              <span className="text-xs text-green-600">✅</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Successful login
                </p>
                <p className="text-xs text-gray-500">2024-06-17 14:20 • Safari on iPhone</p>
              </div>
              <span className="text-xs text-green-600">✅</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
