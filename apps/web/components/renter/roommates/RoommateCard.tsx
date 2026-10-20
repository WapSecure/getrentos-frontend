'use client';

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
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  NumberInput,
  type BadgeVariant,
} from '@getrentos/ui';
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

const statusConfig: Record<
  Roommate['status'],
  { label: string; variant: BadgeVariant; icon: typeof CheckCircle }
> = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  inactive: { label: 'Inactive', variant: 'danger', icon: XCircle },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

export const RoommateCard = ({ roommate, onRemove, onUpdateShare }: RoommateCardProps) => {
  const [isEditingShare, setIsEditingShare] = useState(false);
  const [sharePercentage, setSharePercentage] = useState(roommate.sharePercentage);

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
    <div className="group p-4 hover:bg-secondary transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex min-w-0 items-center gap-3 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {getInitials(roommate.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-foreground">{roommate.name}</h4>
              <Badge
                variant={statusConfig[roommate.status].variant}
                icon={<StatusIcon className="w-3 h-3" aria-hidden="true" />}
              >
                {statusConfig[roommate.status].label}
              </Badge>
              {roommate.rating && (
                <span className="inline-flex items-center gap-0.5 text-xs text-warning">
                  <Star className="w-3 h-3 fill-warning text-warning" aria-hidden="true" />
                  {roommate.rating}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                  <Badge key={task}>{task}</Badge>
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
                  aria-label={`Rent share for ${roommate.name}`}
                  value={sharePercentage}
                  onValueChange={(v) => setSharePercentage(Number(v) || 0)}
                  className="w-20"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <IconButton
                  size="sm"
                  label="Save share"
                  onClick={handleUpdateShare}
                  icon={<Check className="text-success" />}
                />
                <IconButton
                  size="sm"
                  label="Cancel editing share"
                  onClick={() => setIsEditingShare(false)}
                  icon={<X className="text-destructive" />}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {roommate.sharePercentage}%
                </span>
                <IconButton
                  size="sm"
                  label={`Edit rent share for ${roommate.name}`}
                  onClick={() => setIsEditingShare(true)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  icon={<Edit2 />}
                />
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                size="sm"
                label={`Actions for ${roommate.name}`}
                icon={<MoreVertical />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => onRemove(roommate.id)} className="text-destructive">
                <Trash2 className="w-3 h-3" aria-hidden="true" />
                Remove Roommate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
