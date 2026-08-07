'use client';

import { motion } from 'framer-motion';
import {
  UserCog,
  CheckCircle2,
  ArrowUpCircle,
  Wrench,
  Zap,
  Wifi,
  ShieldAlert,
  Droplets,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/format';
import type { LandlordMaintenanceRequest } from '@/types/landlord';
import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceRequestStatus,
} from '@/types/maintenance';

const categoryIcons: Record<MaintenanceCategory, React.ElementType> = {
  plumbing: Droplets,
  electrical: Zap,
  internet: Wifi,
  security: ShieldAlert,
  appliances: Wrench,
  other: Wrench,
};

const priorityConfig: Record<MaintenancePriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800' },
  medium: {
    label: 'Medium',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  high: {
    label: 'High',
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  urgent: {
    label: 'Urgent',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

const statusConfig: Record<MaintenanceRequestStatus, { label: string; className: string }> = {
  submitted: {
    label: 'Submitted',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  assigned: {
    label: 'Assigned',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  in_progress: {
    label: 'In Progress',
    className: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  },
  resolved: {
    label: 'Resolved',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
};

interface MaintenanceRequestCardProps {
  request: LandlordMaintenanceRequest;
  delay?: number;
  onAssignVendor: (request: LandlordMaintenanceRequest) => void;
  onMarkResolved: (id: string) => void;
  onEscalate: (id: string) => void;
}

export const MaintenanceRequestCard = ({
  request,
  delay = 0,
  onAssignVendor,
  onMarkResolved,
  onEscalate,
}: MaintenanceRequestCardProps) => {
  const CategoryIcon = categoryIcons[request.category];
  const priority = priorityConfig[request.priority];
  const status = statusConfig[request.status];
  const isResolved = request.status === 'resolved';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 flex-shrink-0">
            <CategoryIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {request.issueTitle}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {request.tenantName} • {request.propertyName}, {request.unitName}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.className}`}>
          {priority.label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">
        {request.description}
      </p>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">Reported {formatRelativeTime(request.createdAt)}</p>
        {request.assignedVendorName && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Vendor:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {request.assignedVendorName}
            </span>
          </p>
        )}
      </div>

      {!isResolved && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="gap-1.5"
            onClick={() => onAssignVendor(request)}
          >
            <UserCog className="w-3.5 h-3.5" />
            {request.assignedVendorName ? 'Reassign' : 'Assign Vendor'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5 text-orange-500 hover:text-orange-700"
            title="Escalate"
            onClick={() => onEscalate(request.id)}
          >
            <ArrowUpCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="px-2.5"
            title="Mark Resolved"
            onClick={() => onMarkResolved(request.id)}
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};
