'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MessageCircle,
  CreditCard,
  Wrench,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@getrentos/ui';
import { notificationHref } from '@/lib/notificationHref';

interface NotificationMetadata {
  propertyId?: string;
  applicationId?: string;
  paymentId?: string;
  maintenanceId?: string;
  messageId?: string;
  leaseId?: string;
  trustScore?: number;
  amount?: number;
  sender?: string;
}

interface Notification {
  id: string;
  type: 'application' | 'message' | 'payment' | 'maintenance' | 'lease' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  action?: {
    label: string;
    url: string;
  };
  metadata?: NotificationMetadata;
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  application: {
    icon: FileText,
    color: 'text-info',
    bg: 'bg-info-subtle',
  },
  message: {
    icon: MessageCircle,
    color: 'text-purple',
    bg: 'bg-purple-subtle',
  },
  payment: {
    icon: CreditCard,
    color: 'text-success',
    bg: 'bg-success-subtle',
  },
  maintenance: {
    icon: Wrench,
    color: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  lease: {
    icon: FileCheck,
    color: 'text-info',
    bg: 'bg-info-subtle',
  },
  system: {
    icon: AlertCircle,
    color: 'text-muted-foreground',
    bg: 'bg-secondary',
  },
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return format(date, 'MMM d, yyyy');
};

export const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const config = typeConfig[notification.type] || typeConfig.system;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    const href = notificationHref('renter', notification);
    if (href) router.push(href);
  };

  // No event parameter needed since Button component doesn't pass it
  const handleMarkAsReadClick = () => {
    onMarkAsRead(notification.id);
  };

  const handleDeleteClick = () => {
    onDelete(notification.id);
  };

  const handleActionClick = () => {
    handleClick();
  };

  return (
    <div
      className={`group p-4 rounded-xl transition-all cursor-pointer ${
        notification.read
          ? 'hover:bg-secondary'
          : 'bg-info-subtle/50 hover:bg-info-subtle'
      } ${isHovered ? 'shadow-sm' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-semibold ${
                    notification.read ? 'text-foreground' : 'text-foreground'
                  }`}
                >
                  {notification.title}
                </h4>
                {!notification.read && (
                  <span className="w-2 h-2 bg-info rounded-full shrink-0" />
                )}
              </div>
              <p
                className={`text-sm ${
                  notification.read ? 'text-muted-foreground' : 'text-foreground'
                } mt-0.5`}
              >
                {notification.message}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{formatTimeAgo(notification.createdAt)}</span>
                <span className="capitalize">{notification.type}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {notification.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-0 text-primary"
                  onClick={handleActionClick}
                >
                  {notification.action.label}
                  <ChevronRight className="w-3 h-3" />
                </Button>
              )}
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-info hover:text-info"
                  onClick={handleMarkAsReadClick}
                  title="Mark as read"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDeleteClick}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
