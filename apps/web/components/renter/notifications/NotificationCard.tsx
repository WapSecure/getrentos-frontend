'use client';

import { useState } from 'react';
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
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  message: {
    icon: MessageCircle,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  payment: {
    icon: CreditCard,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  maintenance: {
    icon: Wrench,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  lease: {
    icon: FileCheck,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  system: {
    icon: AlertCircle,
    color: 'text-muted-foreground',
    bg: 'bg-gray-50 dark:bg-gray-800',
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
  const [isHovered, setIsHovered] = useState(false);
  const config = typeConfig[notification.type] || typeConfig.system;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action) {
      window.location.href = notification.action.url;
    }
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
          : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
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
                  <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                )}
              </div>
              <p
                className={`text-sm ${
                  notification.read ? 'text-muted-foreground' : 'text-foreground'
                } mt-0.5`}
              >
                {notification.message}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
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
                  className="p-1 h-auto text-blue-500 hover:text-blue-700"
                  onClick={handleMarkAsReadClick}
                  title="Mark as read"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
