'use client';

import { useState } from 'react';
import { Eye, User, Users, Globe, Lock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const PrivacySettings = () => {
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showActivity: true,
    allowMessages: true,
    shareData: false,
  });

  const visibilityOptions = [
    { id: 'public', label: 'Public', icon: Globe },
    { id: 'private', label: 'Private', icon: Lock },
    { id: 'contacts', label: 'Contacts Only', icon: Users },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Privacy Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Control who can see your information and activity
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Visibility
          </label>
          <div className="grid grid-cols-3 gap-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = privacy.profileVisibility === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setPrivacy({ ...privacy, profileVisibility: option.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-[#c4a747] bg-[#c4a747]/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-[#c4a747]' : 'text-gray-500'}`}
                  />
                  <p
                    className={`text-xs text-center ${isSelected ? 'text-[#c4a747]' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    {option.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            What others can see
          </label>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Email Address</span>
            </div>
            <button
              onClick={() => setPrivacy({ ...privacy, showEmail: !privacy.showEmail })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacy.showEmail ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Phone Number</span>
            </div>
            <button
              onClick={() => setPrivacy({ ...privacy, showPhone: !privacy.showPhone })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacy.showPhone ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacy.showPhone ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Activity Status</span>
            </div>
            <button
              onClick={() => setPrivacy({ ...privacy, showActivity: !privacy.showActivity })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacy.showActivity ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacy.showActivity ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <Button variant="primary" className="w-full">
          Save Privacy Settings
        </Button>
      </div>
    </div>
  );
};
