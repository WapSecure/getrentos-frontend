'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Home,
  User,
  Star,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Application } from '@/types/renter';

interface ApplicationCardProps {
  application: Application;
  viewMode: 'grid' | 'list';
  onViewDetails: () => void;
  onWithdraw?: (application: Application) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Clock,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: XCircle,
  },
};

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
  const StatusIcon = statusConfig[application.status].icon;
  const canWithdraw = application.status !== 'approved' && application.status !== 'rejected';

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-40 h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-[#2a3a3f] dark:to-[#1a2a2f] flex items-center justify-center flex-shrink-0 relative">
            <Home className="w-8 h-8 text-gray-400" />
          </div>

          <div className="flex-1 p-4">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white hover:text-[#c4a747] transition-colors">
                  {application.title}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{application.address}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-[#c4a747]">
                  {formatPrice(application.price, application.period)}
                </span>
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[application.status].color}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[application.status].label}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
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
                <span className="text-gray-700 dark:text-gray-300">
                  {application.landlord.name}
                </span>
                <Star className="w-3 h-3 fill-[#c4a747] text-[#c4a747]" />
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
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-md transition-shadow group"
    >
      <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-[#2a3a3f] dark:to-[#1a2a2f] flex items-center justify-center relative">
        <Home className="w-10 h-10 text-gray-400" />
        <div
          className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[application.status].color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConfig[application.status].label}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#c4a747] transition-colors">
          {application.title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="text-xs line-clamp-1">{application.address}</span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
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

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
          <div>
            <span className="font-bold text-[#c4a747]">
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
