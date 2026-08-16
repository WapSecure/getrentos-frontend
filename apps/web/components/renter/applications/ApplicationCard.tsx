'use client';

import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { applicationStatusBadges } from '@/lib/statusBadge';
import { Application } from '@/types/renter';

interface ApplicationCardProps {
  application: Application;
  viewMode: 'grid' | 'list';
  onViewDetails: () => void;
  onWithdraw?: (application: Application) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const canWithdraw = application.status !== 'approved' && application.status !== 'rejected';

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-40 h-32 bg-linear-to-br from-secondary to-muted flex items-center justify-center shrink-0 relative">
            <Home className="w-8 h-8 text-gray-400" />
          </div>

          <div className="flex-1 p-4">
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
                <span>{application.bedrooms} beds</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-3 h-3" />
                <span>{application.bathrooms} baths</span>
              </div>
              <div className="flex items-center gap-1">
                <Square className="w-3 h-3" />
                <span>{application.size} sqft</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Applied {formatDate(application.applicationDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{application.landlord.responseRate}% response</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span className="text-foreground">{application.landlord.name}</span>
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span>{application.landlord.rating || 4.8}</span>
              </div>
              <div className="flex gap-2">
                {canWithdraw && onWithdraw && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onWithdraw(application)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Withdraw
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={onViewDetails} className="gap-1">
                  View Details
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group"
    >
      <div className="h-32 bg-linear-to-br from-secondary to-muted flex items-center justify-center relative">
        <Home className="w-10 h-10 text-gray-400" />
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

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
          <div>
            <span className="font-bold text-primary">
              {formatPrice(application.price, application.period)}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <User className="w-3 h-3" />
              <span>{application.landlord.name}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {canWithdraw && onWithdraw && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onWithdraw(application)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onViewDetails} className="gap-1 px-2">
              View
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
