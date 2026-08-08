'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { RealtorClient, ClientRole } from '@/types/realtor';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    client: Omit<RealtorClient, 'id' | 'status' | 'propertiesRepresented' | 'joinedDate'>
  ) => void;
}

export const AddClientModal = ({ isOpen, onClose, onSubmit }: AddClientModalProps) => {
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<ClientRole>('owner');

  const handleClose = () => {
    setClientName('');
    setEmail('');
    setPhone('');
    setRole('owner');
    onClose();
  };

  const handleSubmit = () => {
    onSubmit({ clientName, email, phone, role });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Client</h3>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['owner', 'landlord'] as ClientRole[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        role === option
                          ? 'border-[#c4a747] bg-[#c4a747]/10 text-[#c4a747]'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {option === 'owner' ? 'Property Owner' : 'Landlord'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                disabled={!clientName || !email}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Client
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
