export type PeriodType = 'month' | 'year' | 'week';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type PaymentStatus = 'upcoming' | 'overdue' | 'paid';
export type MaintenanceStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  period: PeriodType;
  bedrooms: number;
  bathrooms: number;
  size: number;
  rating: number;
  verified: boolean;
  image: string;
  score?: number;
  hasVirtualTour?: boolean;
  virtualTourUrl?: string;
  landlordResponseRate?: number;
  landlordRating?: number;
  landlordReviews?: number;
  landlordVerified?: boolean;
}

export interface Document {
  name: string;
  uploaded: boolean;
  required: boolean;
}

export interface LandlordInfo {
  name: string;
  email: string;
  phone: string;
  responseRate: number;
  rating?: number;
}

export interface TimelineStep {
  stage: string;
  date: string;
  completed: boolean;
}

export interface Application {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  status: ApplicationStatus;
  date: string;
  price: number;
  period: PeriodType;
  bedrooms: number;
  bathrooms: number;
  size: number;
  image: string;
  applicationDate: string;
  moveInDate: string;
  leaseTerm: string;
  documents: Document[];
  landlord: LandlordInfo;
  applicationNotes?: string;
  timeline: TimelineStep[];
}

export const formatPrice = (price: number, period: PeriodType): string => {
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
