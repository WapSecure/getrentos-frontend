'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  User,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Wrench,
  Phone,
  Mail,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest;
  onUpdateStatus: (id: string, status: MaintenanceRequest['status']) => void;
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-800', icon: User },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Wrench },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MaintenanceDetailsModal = ({
  isOpen,
  onClose,
  request,
  onUpdateStatus,
}: MaintenanceDetailsModalProps) => {
  const PriorityIcon = priorityConfig[request.priority].icon;
  const StatusIcon = statusConfig[request.status].icon;

  const handleStatusUpdate = (status: MaintenanceRequest['status']) => {
    onUpdateStatus(request.id, status);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
              <div>
                <h3 className="font-semibold text-foreground">Maintenance Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{request.propertyName}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title & Status */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-lg font-semibold text-foreground">{request.title}</h4>
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[request.priority].color}`}
                  >
                    <PriorityIcon className="w-3 h-3" />
                    {priorityConfig[request.priority].label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[request.status].color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[request.status].label}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Reported</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Category</span>
                  </div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {request.category}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-xs text-gray-500">Description</span>
                <p className="text-sm text-foreground mt-1">{request.description}</p>
              </div>

              {/* Vendor Info */}
              {request.assignedVendorName && (
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      Assigned Vendor
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {request.assignedVendorName}
                  </p>
                </div>
              )}

              {/* Status Update Actions */}
              {request.status !== 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Update Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {request.status !== 'assigned' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate('assigned')}
                      >
                        Mark Assigned
                      </Button>
                    )}
                    {request.status !== 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate('in_progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusUpdate('resolved')}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              )}

              {/* SLA Info */}
              {request.slaResponseTime !== undefined && (
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      SLA Response Time
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {request.slaResponseTime} hours
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
