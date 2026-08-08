'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getInitials, formatDate, formatRelativeTime } from '@/lib/format';
import type { PlatformUser, UserAccountStatus } from '@/types/admin';

interface UserDetailModalProps {
  user: PlatformUser | null;
  onClose: () => void;
  onChangeStatus: (userId: string, status: UserAccountStatus) => void;
}

const roleLabels: Record<string, string> = {
  renter: 'Renter',
  landlord: 'Landlord',
  owner: 'Property Owner',
  buyer: 'Buyer',
  realtor: 'Realtor',
  agent: 'Agent',
  admin: 'Admin',
};

export const UserDetailModal = ({ user, onClose, onChangeStatus }: UserDetailModalProps) => {
  if (!user) return null;

  return (
    <AnimatePresence>
      {user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-sm">
                  {getInitials(user.fullName)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{user.fullName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300"
                    >
                      {roleLabels[role] || role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Trust Score</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {user.trustScore}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Joined</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(user.joinedDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Active</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatRelativeTime(user.lastActiveAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Close
              </Button>
              {user.status !== 'suspended' ? (
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onChangeStatus(user.id, 'suspended')}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Suspend
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onChangeStatus(user.id, 'active')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Reactivate
                </Button>
              )}
              {user.status !== 'banned' && (
                <Button
                  variant="ghost"
                  className="flex-1 gap-1.5 text-red-600 dark:text-red-400"
                  onClick={() => onChangeStatus(user.id, 'banned')}
                >
                  <Ban className="w-3.5 h-3.5" />
                  Ban
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
