'use client';

import {
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Clock,
  ChevronRight,
  Home,
  User,
  Star,
  Trash2,
} from '@sureground/icons';
import { Badge, Button, IconButton } from '@sureground/ui';
import { applicationStatusBadges } from '@/lib/statusBadge';
import { pluralize } from '@/lib/format';
import { Application } from '@/types/renter';
import { RecordIconTile, recordCardClass } from '@/components/shared/records/RecordParts';

interface ApplicationCardProps {
  application: Application;
  viewMode: 'grid' | 'list';
  onViewDetails: () => void;
  onWithdraw?: (application: Application) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatPrice = (price: number, period: string) => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(price)}/${period === 'month' ? 'mo' : period === 'year' ? 'yr' : 'wk'}`;
};

export const ApplicationCard = ({
  application,
  viewMode,
  onViewDetails,
  onWithdraw,
}: ApplicationCardProps) => {
  const status = applicationStatusBadges[application.status];
  // Matches the API: only an application still awaiting a decision can be withdrawn.
  const canWithdraw = application.status === 'pending' || application.status === 'under_review';

  if (viewMode === 'list') {
    return (
      <div className={recordCardClass()}>
        <div className="flex items-start gap-3.5">
          <RecordIconTile icon={Home} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                  {application.title}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{application.address}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-primary">
                  {formatPrice(application.price, application.period)}
                </span>
                <Badge
                  variant={status.variant}
                  icon={status.icon && <status.icon className="w-3 h-3" />}
                >
                  {status.label}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Bed className="w-3 h-3" />
                <span>{pluralize(application.bedrooms, 'bed')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-3 h-3" />
                <span>{pluralize(application.bathrooms, 'bath')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Square className="w-3 h-3" />
                <span>{application.size} sqm</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Applied {formatDate(application.applicationDate)}</span>
              </div>
              {application.landlord.responseRate !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{application.landlord.responseRate}% response</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 mt-3">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="text-foreground">{application.landlord.name}</span>
                {(application.landlord.rating ?? 0) > 0 && (
                  <>
                    <Star className="h-3 w-3 fill-primary text-primary" aria-hidden="true" />
                    <span>{application.landlord.rating}</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {canWithdraw && onWithdraw && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onWithdraw(application)}
                    icon={<Trash2 className="w-4 h-4" />}
                    className="text-destructive hover:bg-destructive-subtle hover:text-destructive"
                  >
                    Withdraw
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onViewDetails}
                  icon={<ChevronRight className="w-3 h-3" />}
                  iconPosition="right"
                >
                  View details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group overflow-hidden ${recordCardClass()} p-0 sm:p-0`}>
      <div className="relative flex h-24 items-center justify-center border-b border-border bg-primary/[0.05]">
        <RecordIconTile icon={Home} />
        <Badge
          variant={status.variant}
          icon={status.icon && <status.icon className="w-3 h-3" />}
          className="absolute top-2 right-2"
        >
          {status.label}
        </Badge>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {application.title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="text-xs line-clamp-1">{application.address}</span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="w-3 h-3" />
            <span>{application.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3 h-3" />
            <span>{application.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="w-3 h-3" />
            <span>{application.size}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
          <div>
            <span className="font-bold text-primary">
              {formatPrice(application.price, application.period)}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <User className="w-3 h-3" />
              <span>{application.landlord.name}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {canWithdraw && onWithdraw && (
              <IconButton
                label="Withdraw application"
                icon={<Trash2 />}
                size="sm"
                variant="danger"
                onClick={() => onWithdraw(application)}
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onViewDetails}
              icon={<ChevronRight className="w-3 h-3" />}
              iconPosition="right"
              aria-label={`View ${application.title}`}
              className="px-2"
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
