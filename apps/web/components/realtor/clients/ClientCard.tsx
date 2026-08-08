'use client';

import { motion } from 'framer-motion';
import { Building2, Home, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getInitials, formatDate } from '@/lib/format';
import type { RealtorClient } from '@/types/realtor';

const statusConfig: Record<RealtorClient['status'], { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  pending: {
    label: 'Pending',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  inactive: {
    label: 'Inactive',
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  },
};

interface ClientCardProps {
  client: RealtorClient;
  onMessage: () => void;
  delay?: number;
}

export const ClientCard = ({ client, onMessage, delay = 0 }: ClientCardProps) => {
  const status = statusConfig[client.status];
  const RoleIcon = client.role === 'owner' ? Building2 : Home;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-sm flex-shrink-0">
            {getInitials(client.clientName)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {client.clientName}
            </h3>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <RoleIcon className="w-3 h-3" />
              {client.role === 'owner' ? 'Property Owner' : 'Landlord'}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-400">Properties</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {client.propertiesRepresented}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Client Since</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(client.joinedDate)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
        <Button variant="outline" size="sm" fullWidth className="gap-1.5" onClick={onMessage}>
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </Button>
      </div>
    </motion.div>
  );
};
