'use client';

import { NumberInput } from '@getrentos/ui';

import { useState } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { format } from 'date-fns';

interface Roommate {
  id: string;
  name: string;
  email: string;
  phone: string;
  sharePercentage: number;
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  responsibilities: string[];
  rating?: number;
}

interface RoommateCardProps {
  roommate: Roommate;
  onRemove: (id: string) => void;
  onUpdateShare: (id: string, percentage: number) => void;
}

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Clock,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: XCircle,
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

export const RoommateCard = ({ roommate, onRemove, onUpdateShare }: RoommateCardProps) => {
  const [isEditingShare, setIsEditingShare] = useState(false);
  const [sharePercentage, setSharePercentage] = useState(roommate.sharePercentage);
  const [showMenu, setShowMenu] = useState(false);

  const StatusIcon = statusConfig[roommate.status].icon;

  const handleUpdateShare = () => {
    onUpdateShare(roommate.id, sharePercentage);
    setIsEditingShare(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="p-4 hover:bg-secondary transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {getInitials(roommate.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-foreground">{roommate.name}</h4>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[roommate.status].color}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig[roommate.status].label}
              </span>
              {roommate.rating && (
                <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {roommate.rating}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{roommate.email}</span>
              </div>
              {roommate.phone && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{roommate.phone}</span>
                  </div>
                </>
              )}
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Joined {formatDate(roommate.joinedDate)}</span>
              </div>
            </div>

            {roommate.responsibilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {roommate.responsibilities.map((task) => (
                  <span
                    key={task}
                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"
                  >
                    {task}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            {isEditingShare ? (
              <div className="flex items-center gap-1">
                <NumberInput
                  integer={false}
                  value={sharePercentage}
                  onValueChange={(v) => setSharePercentage(Number(v) || 0)}
                  className="w-16 px-2 py-1 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-500">%</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUpdateShare}
                  className="p-1 h-auto"
                >
                  <Check className="w-3 h-3 text-green-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingShare(false)}
                  className="p-1 h-auto"
                >
                  <X className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {roommate.sharePercentage}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingShare(true)}
                  className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3 h-3 text-gray-400" />
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 h-auto"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onRemove(roommate.id);
                    setShowMenu(false);
                  }}
                  className="w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Remove Roommate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
