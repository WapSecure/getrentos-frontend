'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MapPin, Bed, Bath, Square, Clock, Eye, Home, CalendarDays, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
type PeriodType = 'month' | 'year' | 'week';

const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Clock,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: Building2,
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
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPrice = (price: number, period: PeriodType) => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const periodMap: Record<PeriodType, string> = {
    month: '/mo',
    year: '/yr',
    week: '/wk',
  };
  return `${formatter.format(price)}${periodMap[period]}`;
};

import { CheckCircle, XCircle } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

export const RenterApplicationsList = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { data: allApplications = [] } = useQuery({
    queryKey: renterKeys.applications,
    queryFn: () => unwrap(renterService.listMyApplications()),
  });
  const applications = allApplications.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t('dashboard.applications.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('dashboard.applications.subtitle')}</p>
        </div>
        <Button href={ROUTES.RENTER_APPLICATIONS} variant="ghost" size="sm" className="gap-1">
          {t('dashboard.applications.view_all')}
          <Eye className="w-3 h-3" />
        </Button>
      </div>

      <div className="divide-y divide-border">
        {applications.map((app, index) => {
          const StatusIcon = statusConfig[app.status].icon;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
              className="p-4 hover:bg-secondary transition-colors cursor-pointer group"
              onClick={() => router.push(ROUTES.RENTER_APPLICATIONS)}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="w-full md:w-16 h-16 bg-linear-to-br from-secondary to-muted rounded-xl flex items-center justify-center shrink-0">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Home className="w-4 h-4 text-primary" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {app.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{app.address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(app.price, app.period)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Bed className="w-3 h-3" />
                      <span>
                        {app.bedrooms} {app.bedrooms === 1 ? 'bed' : 'beds'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      <span>
                        {app.bathrooms} {app.bathrooms === 1 ? 'bath' : 'baths'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="w-3 h-3" />
                      <span>{app.size} sqft</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      <span>Applied {formatDate(app.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[app.status].color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[app.status].label}
                  </span>
                  <Button variant="outline" size="sm" className="hidden md:inline-flex">
                    View Details
                  </Button>
                </div>
              </div>

              <div className="mt-3 md:hidden">
                <Button variant="outline" size="sm" fullWidth>
                  View Details
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
