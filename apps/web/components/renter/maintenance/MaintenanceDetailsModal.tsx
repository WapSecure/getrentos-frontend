'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  User,
  Calendar,
  MapPin,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Alert, Badge, Button, IconButton, type BadgeVariant } from '@getrentos/ui';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest;
  onUpdateStatus: (id: string, status: MaintenanceRequest['status']) => void;
}

type BadgeConfig = { label: string; variant: BadgeVariant; icon: LucideIcon };

const priorityConfig: Record<MaintenanceRequest['priority'], BadgeConfig> = {
  low: { label: 'Low', variant: 'neutral', icon: AlertCircle },
  medium: { label: 'Medium', variant: 'warning', icon: AlertCircle },
  high: { label: 'High', variant: 'warning', icon: AlertCircle },
  urgent: { label: 'Urgent', variant: 'danger', icon: AlertCircle },
};

const statusConfig: Record<MaintenanceRequest['status'], BadgeConfig> = {
  submitted: { label: 'Submitted', variant: 'info', icon: Clock },
  assigned: { label: 'Assigned', variant: 'info', icon: User },
  in_progress: { label: 'In Progress', variant: 'warning', icon: Wrench },
  resolved: { label: 'Resolved', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'neutral', icon: XCircle },
};

const formatDate = (value?: string | null, fallback = 'Not available') => {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const EmergencyTimelineItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-card/70 px-2.5 py-2">
    <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-xs font-medium text-foreground">{value}</p>
  </div>
);

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
              <IconButton label="Close details" icon={<X />} size="sm" onClick={onClose} />
            </div>

            <div className="p-4 space-y-4">
              {/* Title & Status */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-lg font-semibold text-foreground">{request.title}</h4>
                <div className="flex flex-wrap gap-2">
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
              </div>

              {request.isEmergency && (
                <Alert variant="danger" icon={AlertTriangle} title="Emergency request status">
                  <p>
                    {request.acknowledgedAt
                      ? `Acknowledged ${formatDate(request.acknowledgedAt)}.`
                      : 'Awaiting acknowledgement.'}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <EmergencyTimelineItem
                      label="Response target"
                      value={formatDate(request.responseDueAt, 'Not scheduled')}
                    />
                    <EmergencyTimelineItem
                      label="Resolution target"
                      value={formatDate(request.resolutionDueAt, 'Not scheduled')}
                    />
                    <EmergencyTimelineItem
                      label="Escalation review"
                      value={formatDate(request.escalationDueAt, 'Not scheduled')}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-5">
                    These are operational service targets for this request, not a guarantee of a
                    response time. For any immediate threat to life or safety, contact local
                    emergency services first.
                  </p>
                </Alert>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="p-2 rounded-lg bg-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Reported</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-secondary">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Category</span>
                  </div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {request.category}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 rounded-lg bg-secondary">
                <span className="text-xs text-muted-foreground">Description</span>
                <p className="text-sm text-foreground mt-1">{request.description}</p>
              </div>

              {/* Vendor Info */}
              {request.assignedVendorName && (
                <div className="p-3 rounded-lg bg-purple-subtle border border-purple/20">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-purple" />
                    <span className="text-sm font-medium text-purple">
                      Assigned Vendor
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {request.assignedVendorName}
                  </p>
                  {request.scheduledFor && request.status !== 'resolved' && (
                    <p className="mt-1 text-sm text-foreground">
                      Visit booked for{' '}
                      <span className="font-medium">
                        {new Date(request.scheduledFor).toLocaleString('en-NG', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Renters can only cancel a newly submitted request. */}
              {request.status === 'submitted' && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Request</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleStatusUpdate('cancelled')}
                  >
                    Cancel request
                  </Button>
                </div>
              )}

              {/* SLA Info */}
              {request.slaResponseTime !== undefined && (
                <Alert variant="info" icon={Clock} title="SLA Response Time">
                  {request.slaResponseTime} hours
                </Alert>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
