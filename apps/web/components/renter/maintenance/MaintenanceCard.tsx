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
  type LucideIcon,
} from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@getrentos/ui';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceCardProps {
  request: MaintenanceRequest;
  onViewDetails: () => void;
  onRateVendor?: (id: string, rating: number) => void;
  onUpdateStatus?: (id: string, status: MaintenanceRequest['status']) => void;
}

type BadgeConfig = { label: string; variant: BadgeVariant; icon: LucideIcon };

const priorityConfig: Record<MaintenanceRequest['priority'], BadgeConfig> = {
  low: {
    label: 'Low',
    variant: 'neutral',
    icon: AlertCircle,
  },
  medium: {
    label: 'Medium',
    variant: 'warning',
    icon: AlertCircle,
  },
  high: {
    label: 'High',
    variant: 'warning',
    icon: AlertTriangle,
  },
  urgent: {
    label: 'Urgent',
    variant: 'danger',
    icon: AlertTriangle,
  },
};

const statusConfig: Record<MaintenanceRequest['status'], BadgeConfig> = {
  submitted: {
    label: 'Submitted',
    variant: 'info',
    icon: Clock,
  },
  assigned: {
    label: 'Assigned',
    variant: 'info',
    icon: UserCheck,
  },
  in_progress: {
    label: 'In Progress',
    variant: 'warning',
    icon: Wrench,
  },
  resolved: {
    label: 'Resolved',
    variant: 'success',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'neutral',
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
              <Badge variant="danger" icon={<AlertTriangle className="h-3 w-3" />}>
                Emergency
              </Badge>
            )}
            <Badge
              variant={priorityConfig[request.priority].variant}
              icon={<PriorityIcon className="w-3 h-3" />}
            >
              {priorityConfig[request.priority].label}
            </Badge>
            <Badge
              variant={statusConfig[request.status].variant}
              icon={<StatusIcon className="w-3 h-3" />}
            >
              {statusConfig[request.status].label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            <span>{request.propertyName}</span>
            <span>•</span>
            <span>
              {categoryIcon} {request.category}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{request.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
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
            {request.scheduledFor &&
              request.status !== 'resolved' &&
              request.status !== 'cancelled' && (
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    Visit{' '}
                    {new Date(request.scheduledFor).toLocaleString('en-NG', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
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
                    ? 'text-success'
                    : 'text-destructive'
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

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {request.status === 'resolved' && !request.vendorRating && onRateVendor && (
            <Button size="sm" variant="outline" onClick={handleRateVendor}>
              Rate Vendor
            </Button>
          )}
          {request.status === 'submitted' && onUpdateStatus && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleCancel}>
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
