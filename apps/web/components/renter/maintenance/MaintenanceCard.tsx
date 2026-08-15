'use client';

import {
  Wrench,
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  User,
  Star,
  ChevronRight,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceCardProps {
  request: MaintenanceRequest;
  onViewDetails: () => void;
  onRateVendor?: (id: string, rating: number) => void;
  onUpdateStatus?: (id: string, status: MaintenanceRequest['status']) => void;
}

const priorityConfig = {
  low: {
    label: 'Low',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    icon: AlertCircle,
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: AlertCircle,
  },
  high: {
    label: 'High',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    icon: AlertTriangle,
  },
  urgent: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: AlertTriangle,
  },
};

const statusConfig = {
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: Clock,
  },
  assigned: {
    label: 'Assigned',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    icon: UserCheck,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Wrench,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    icon: XCircle,
  },
};

const categoryIcons = {
  plumbing: '💧',
  electrical: '⚡',
  internet: '🌐',
  security: '🔒',
  appliances: '🔧',
  other: '📌',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDeadline = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const MaintenanceCard = ({
  request,
  onViewDetails,
  onRateVendor,
  onUpdateStatus,
}: MaintenanceCardProps) => {
  const PriorityIcon = priorityConfig[request.priority].icon;
  const StatusIcon = statusConfig[request.status].icon;
  const categoryIcon = categoryIcons[request.category as keyof typeof categoryIcons] || '📌';
  const acknowledgementTarget = request.acknowledgedAt
    ? request.resolutionDueAt
    : request.responseDueAt;
  const formattedAcknowledgementTarget = formatDeadline(acknowledgementTarget);

  const handleRateVendor = () => {
    if (onRateVendor) {
      onRateVendor(request.id, 5);
    }
  };

  const handleViewDetails = () => {
    onViewDetails();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateStatus?.(request.id, 'cancelled');
  };

  return (
    <div
      onClick={handleViewDetails}
      className="p-4 hover:bg-secondary transition-colors cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{request.title}</h4>
            {request.isEmergency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-300">
                <AlertTriangle className="h-3 w-3" />
                Emergency
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[request.priority].color}`}
            >
              <PriorityIcon className="w-3 h-3" />
              {priorityConfig[request.priority].label}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[request.status].color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig[request.status].label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{request.propertyName}</span>
            <span>•</span>
            <span>
              {categoryIcon} {request.category}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{request.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Reported {formatDate(request.createdAt)}</span>
            </div>
            {request.assignedVendorName && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{request.assignedVendorName}</span>
              </div>
            )}
            {request.vendorRating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span>{request.vendorRating}.0</span>
              </div>
            )}
            {request.isEmergency && (
              <div
                className={`flex items-center gap-1 font-medium ${
                  request.acknowledgedAt
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {request.acknowledgedAt ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                <span>
                  {request.acknowledgedAt
                    ? `Acknowledged ${formatDeadline(request.acknowledgedAt) ?? ''}`
                    : 'Awaiting acknowledgement'}
                  {formattedAcknowledgementTarget
                    ? ` · ${request.acknowledgedAt ? 'Resolution' : 'Response'} target ${formattedAcknowledgementTarget}`
                    : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {request.status === 'resolved' && !request.vendorRating && onRateVendor && (
            <Button size="sm" variant="outline" onClick={handleRateVendor}>
              Rate Vendor
            </Button>
          )}
          {request.status === 'submitted' && onUpdateStatus && (
            <Button size="sm" variant="ghost" className="text-red-500" onClick={handleCancel}>
              Cancel Request
            </Button>
          )}
          <Button size="sm" variant="ghost" className="gap-1" onClick={handleViewDetails}>
            View Details
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
