import { apiFetch } from './client';
import type { Paginated } from './properties';

/* ------------------------------ dashboard ------------------------------ */

export interface LandlordDashboardStats {
  totalProperties: number;
  occupiedUnits: number;
  reservedUnits: number;
  vacantUnits: number;
  annualRentRoll: number;
  outstandingPayments: number;
  outstandingAmount: number;
  activeMaintenanceRequests: number;
}

export type LandlordActivityType =
  | 'payment'
  | 'application'
  | 'maintenance'
  | 'lease'
  | 'message'
  | 'viewing';

export interface LandlordActivity {
  id: string;
  type: LandlordActivityType;
  title: string;
  description: string;
  timestamp: string;
}

/** One bar in the revenue trend — `label` is a short month name. */
export interface RevenuePoint {
  label: string;
  value: number;
}

/* ------------------------------ properties ----------------------------- */

export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'rejected';

export interface LandlordProperty {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description?: string;
  coverImage?: string;
  galleryImages?: string[];
  verificationStatus: VerificationStatus;
  totalUnits: number;
  occupiedUnits: number;
  annualRentRoll: number;
  createdAt: string;
  archived: boolean;
}

/* -------------------------------- tenants ------------------------------ */

export type RentStatus = 'paid' | 'due' | 'overdue' | 'partial';

export interface LandlordTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  leaseId?: string;
  moveInDate: string;
  trustScore: number;
  verified: boolean;
  rentStatus: RentStatus;
}

export const RENT_STATUS_LABEL: Record<RentStatus, string> = {
  paid: 'Paid',
  due: 'Due',
  overdue: 'Overdue',
  partial: 'Part paid',
};

export const RENT_STATUS_TONE: Record<RentStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  paid: 'success',
  due: 'warning',
  overdue: 'danger',
  partial: 'info',
};

export const VERIFICATION_TONE: Record<
  VerificationStatus,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  verified: 'success',
  pending: 'warning',
  unverified: 'neutral',
  rejected: 'danger',
};

/* --------------------------------- units ------------------------------- */

export type OccupancyStatus = 'occupied' | 'vacant' | 'reserved';

export interface LandlordUnit {
  id: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  bedrooms: number;
  bathrooms: number;
  askingRent: number;
  askingRentPeriod: 'year' | 'month';
  occupancyStatus: OccupancyStatus;
}

export const OCCUPANCY_LABEL: Record<OccupancyStatus, string> = {
  occupied: 'Occupied',
  vacant: 'Vacant',
  reserved: 'Reserved',
};

export const OCCUPANCY_TONE: Record<OccupancyStatus, 'success' | 'warning' | 'neutral'> = {
  occupied: 'success',
  vacant: 'neutral',
  reserved: 'warning',
};

/* ------------------------------- messages ------------------------------ */

export interface LandlordConversation {
  id: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const landlordApi = {
  dashboardStats: () => apiFetch<LandlordDashboardStats>('/landlord/dashboard/stats'),

  activity: () => apiFetch<LandlordActivity[]>('/landlord/dashboard/activity'),

  revenueTrend: () => apiFetch<RevenuePoint[]>('/landlord/dashboard/revenue-trend'),

  properties: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordProperty>>(`/landlord/properties?page=${page}&pageSize=${pageSize}`),

  units: (propertyId: string) =>
    apiFetch<Paginated<LandlordUnit>>(`/landlord/units?propertyId=${propertyId}`),

  tenants: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandlordTenant>>(`/landlord/tenants?page=${page}&pageSize=${pageSize}`),

  conversations: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<LandlordConversation>>(
      `/landlord/messages/conversations?page=${page}&pageSize=${pageSize}`
    ),

  markConversationRead: (id: string) =>
    apiFetch<void>(`/landlord/messages/conversations/${id}/read`, { method: 'PATCH' }),
};
