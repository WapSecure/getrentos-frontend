import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { Property, Application, GeoInsights } from '@/types/renter';
import type { ApplicationFormData } from '@/components/renter/property-apply/ApplicationWizard';
import type { CalendarEvent, CalendarEventFormData } from '@/types/calendar';
import type { VerificationItem, TrustScoreHistoryItem, Badge } from '@/types/trust-score';
import type { Conversation, Reminder } from '@/types/messages';
import type { RenewalOffer } from '@/types/lease';
import type { MaintenanceRequest } from '@/types/maintenance';
import type { Notification } from '@/types/notification';

export interface SavedSearch {
  id: string;
  name: string;
  filters: {
    location?: string;
    bedrooms?: number;
    maxPrice?: number;
    propertyType?: string;
    verifiedOnly?: boolean;
  };
  createdAt: string;
  alertsEnabled: boolean;
  lastRun: string;
  newMatches: number;
}

export interface MoveInChecklistItem {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface Lease {
  id: string;
  propertyId: string;
  propertyName: string;
  address: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  renewalTerms: string;
  status: 'active' | 'expiring' | 'expired';
  landlord: { name: string; email: string; phone: string };
  documents: { name: string; type: string; uploadedAt: string; url: string }[];
  timeline: { date: string; event: string; description: string }[];
  paymentHistory: {
    month: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    date: string;
  }[];
}

export interface RentIncrease {
  date: string;
  oldAmount: number;
  newAmount: number;
  percentageChange: number;
  reason: string;
}

export interface UpcomingPaymentReminder {
  id: string;
  dueDate: string;
  amount: number;
  propertyName: string;
  status: 'upcoming';
  daysRemaining: number;
}

export interface Payment {
  id: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  method?: 'card' | 'bank_transfer' | 'wallet';
  receiptUrl?: string;
  description: string;
  dueDate: string;
  escrowStatus: 'held' | 'released' | 'pending';
}

export interface Receipt {
  id: string;
  paymentId: string;
  propertyName: string;
  amount: number;
  date: string;
  fileName: string;
  url: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
}

export interface NotificationPreference {
  id: string;
  category: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface DashboardStats {
  savedPropertiesCount: number;
  activeApplicationsCount: number;
  unreadMessagesCount: number;
  upcomingViewingsCount: number;
}

export interface RenterProfile {
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Roommate {
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

export interface RoommateExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  category: 'rent' | 'utilities' | 'groceries' | 'other';
}

export interface TrustScoreOverview {
  trustScore: number;
  verifications: VerificationItem[];
  history: TrustScoreHistoryItem[];
  badges: Badge[];
}

export interface RenterDocument {
  id: string;
  name: string;
  type: 'lease' | 'receipt' | 'inspection' | 'other';
  category: string;
  size: string;
  uploadedAt: string;
  updatedAt: string;
  url: string;
  isFavorite: boolean;
  sharedWith?: string[];
  expiryDate?: string;
  version: number;
  status: 'active' | 'expiring' | 'expired';
  tags?: string[];
}

export interface RenterListingsFilters {
  search?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  verifiedOnly?: boolean;
}

export const renterService = {
  // ---- Listings ----
  async listListings(filters: RenterListingsFilters = {}): Promise<ApiResponse<Property[]>> {
    const { verifiedOnly, ...rest } = filters;
    return safeCall(() =>
      authFetch(
        `/renter/listings${toQuery({ ...rest, verifiedOnly: verifiedOnly ? 'true' : undefined })}`
      )
    );
  },

  async getListing(id: string): Promise<ApiResponse<Property>> {
    return safeCall(() => authFetch(`/renter/listings/${id}`));
  },

  /** Real map + neighborhood/property insights for a listing (Google Maps + optional AI). */
  async getGeoInsights(id: string, destination?: string): Promise<ApiResponse<GeoInsights>> {
    const query = destination ? `?destination=${encodeURIComponent(destination)}` : '';
    return safeCall(() => authFetch(`/renter/listings/${id}/geo-insights${query}`));
  },

  // ---- Saved listings ----
  async listSavedListings(): Promise<ApiResponse<Property[]>> {
    return safeCall(() => authFetch('/renter/saved-listings'));
  },

  async saveListing(listingId: string): Promise<ApiResponse<{ saved: boolean }>> {
    return safeCall(() => authFetch(`/renter/saved-listings/${listingId}`, { method: 'POST' }));
  },

  async unsaveListing(listingId: string): Promise<ApiResponse<{ saved: boolean }>> {
    return safeCall(() => authFetch(`/renter/saved-listings/${listingId}`, { method: 'DELETE' }));
  },

  // ---- Applications ----
  async listMyApplications(): Promise<ApiResponse<Application[]>> {
    return safeCall(() => authFetch('/renter/applications'));
  },

  async withdrawApplication(id: string): Promise<ApiResponse<Application>> {
    return safeCall(() => authFetch(`/renter/applications/${id}/withdraw`, { method: 'PATCH' }));
  },

  async submitApplication(
    listingId: string,
    data: ApplicationFormData
  ): Promise<ApiResponse<Application>> {
    return safeCall(() =>
      authFetch('/renter/applications', {
        method: 'POST',
        body: JSON.stringify({
          listingId,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          currentAddress: data.currentAddress,
          employer: data.employer,
          employmentStatus: data.employmentStatus,
          monthlyIncome: Number(data.monthlyIncome) || 0,
          moveInDate: data.moveInDate || undefined,
          leaseTerm: data.leaseTerm,
          notes: data.notes,
          documents: data.documents,
        }),
      })
    );
  },

  // ---- Roommates ----
  async listRoommates(): Promise<ApiResponse<Roommate[]>> {
    return safeCall(() => authFetch('/renter/roommates'));
  },

  async inviteRoommate(email: string, message?: string): Promise<ApiResponse<Roommate>> {
    return safeCall(() =>
      authFetch('/renter/roommates/invite', {
        method: 'POST',
        body: JSON.stringify({ email, message }),
      })
    );
  },

  async removeRoommate(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/roommates/${id}`, { method: 'DELETE' }));
  },

  async updateRoommateShare(id: string, sharePercentage: number): Promise<ApiResponse<Roommate>> {
    return safeCall(() =>
      authFetch(`/renter/roommates/${id}/share`, {
        method: 'PATCH',
        body: JSON.stringify({ sharePercentage }),
      })
    );
  },

  async completeRoommateTask(id: string, task: string): Promise<ApiResponse<Roommate>> {
    return safeCall(() =>
      authFetch(`/renter/roommates/${id}/tasks/${encodeURIComponent(task)}/complete`, {
        method: 'PATCH',
      })
    );
  },

  async listRoommateExpenses(): Promise<ApiResponse<RoommateExpense[]>> {
    return safeCall(() => authFetch('/renter/roommates/expenses'));
  },

  async addRoommateExpense(
    expense: Omit<RoommateExpense, 'id' | 'date'>
  ): Promise<ApiResponse<RoommateExpense>> {
    return safeCall(() =>
      authFetch('/renter/roommates/expenses', { method: 'POST', body: JSON.stringify(expense) })
    );
  },

  // ---- Calendar ----
  async listCalendarEvents(): Promise<ApiResponse<CalendarEvent[]>> {
    return safeCall(() => authFetch('/renter/calendar-events'));
  },

  async createCalendarEvent(data: CalendarEventFormData): Promise<ApiResponse<CalendarEvent>> {
    return safeCall(() =>
      authFetch('/renter/calendar-events', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async updateCalendarEvent(
    id: string,
    data: Partial<CalendarEventFormData & { status: string }>
  ): Promise<ApiResponse<CalendarEvent>> {
    return safeCall(() =>
      authFetch(`/renter/calendar-events/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    );
  },

  async deleteCalendarEvent(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/calendar-events/${id}`, { method: 'DELETE' }));
  },

  // ---- Trust score ----
  async getTrustScore(): Promise<ApiResponse<TrustScoreOverview>> {
    return safeCall(() => authFetch('/renter/trust-score'));
  },

  // ---- Documents ----
  async listDocuments(): Promise<ApiResponse<RenterDocument[]>> {
    return safeCall(() => authFetch('/renter/documents'));
  },

  async uploadDocument(
    file: File,
    name: string,
    type: string,
    category: string,
    tags: string[]
  ): Promise<ApiResponse<RenterDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('type', type);
    formData.append('category', category);
    tags.forEach((tag) => formData.append('tags[]', tag));
    return safeCall(() => authFetch('/renter/documents', { method: 'POST', body: formData }));
  },

  async getDocumentDownloadUrl(id: string): Promise<ApiResponse<{ url: string; name: string }>> {
    return safeCall(() => authFetch(`/renter/documents/${id}/download`));
  },

  async toggleDocumentFavorite(id: string): Promise<ApiResponse<RenterDocument>> {
    return safeCall(() => authFetch(`/renter/documents/${id}/favorite`, { method: 'PATCH' }));
  },

  async shareDocument(id: string, email: string): Promise<ApiResponse<RenterDocument>> {
    return safeCall(() =>
      authFetch(`/renter/documents/${id}/share`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    );
  },

  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/documents/${id}`, { method: 'DELETE' }));
  },

  // ---- Messages ----
  async listConversations(): Promise<ApiResponse<Conversation[]>> {
    return safeCall(() => authFetch('/renter/messages'));
  },

  async sendMessage(
    conversationId: string,
    text: string,
    files: File[] = []
  ): Promise<ApiResponse<Conversation>> {
    const formData = new FormData();
    formData.append('text', text);
    files.forEach((file) => formData.append('files', file));
    return safeCall(() =>
      authFetch(`/renter/messages/${conversationId}/messages`, { method: 'POST', body: formData })
    );
  },

  async markConversationRead(conversationId: string): Promise<ApiResponse<Conversation>> {
    return safeCall(() =>
      authFetch(`/renter/messages/${conversationId}/read`, { method: 'PATCH' })
    );
  },

  async togglePinConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return safeCall(() => authFetch(`/renter/messages/${conversationId}/pin`, { method: 'PATCH' }));
  },

  async toggleArchiveConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return safeCall(() =>
      authFetch(`/renter/messages/${conversationId}/archive`, { method: 'PATCH' })
    );
  },

  // ---- Message reminders ----
  async listReminders(): Promise<ApiResponse<Reminder[]>> {
    return safeCall(() => authFetch('/renter/messages/reminders'));
  },

  async createReminder(data: {
    message: string;
    date: string;
    time: string;
  }): Promise<ApiResponse<Reminder>> {
    return safeCall(() =>
      authFetch('/renter/messages/reminders', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async toggleReminder(id: string): Promise<ApiResponse<Reminder>> {
    return safeCall(() =>
      authFetch(`/renter/messages/reminders/${id}/toggle`, { method: 'PATCH' })
    );
  },

  async deleteReminder(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/messages/reminders/${id}`, { method: 'DELETE' }));
  },

  // ---- Lease ----
  async getLease(): Promise<ApiResponse<Lease>> {
    return safeCall(() => authFetch('/renter/lease'));
  },

  async getRentIncreases(): Promise<ApiResponse<RentIncrease[]>> {
    return safeCall(() => authFetch('/renter/lease/rent-increases'));
  },

  async getUpcomingPaymentReminders(): Promise<ApiResponse<UpcomingPaymentReminder[]>> {
    return safeCall(() => authFetch('/renter/lease/payment-reminders'));
  },

  async getRenewalOffer(): Promise<ApiResponse<RenewalOffer | null>> {
    return safeCall(() => authFetch('/renter/lease/renewal-offer'));
  },

  async respondToRenewalOffer(
    offerId: string,
    action: 'accept' | 'decline'
  ): Promise<ApiResponse<RenewalOffer>> {
    return safeCall(() =>
      authFetch(`/renter/lease/renewal-offer/${offerId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
    );
  },

  async requestLeaseTermination(
    noticeDate: string,
    reason: string
  ): Promise<ApiResponse<{ id: string; status: string }>> {
    return safeCall(() =>
      authFetch('/renter/lease/termination-request', {
        method: 'POST',
        body: JSON.stringify({ noticeDate, reason }),
      })
    );
  },

  // ---- Payments ----
  async listPayments(): Promise<ApiResponse<Payment[]>> {
    return safeCall(() => authFetch('/renter/payments'));
  },

  async listReceipts(): Promise<ApiResponse<Receipt[]>> {
    return safeCall(() => authFetch('/renter/payments/receipts'));
  },

  async payNow(paymentId: string, method?: string): Promise<ApiResponse<Payment>> {
    return safeCall(() =>
      authFetch(`/renter/payments/${paymentId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ method }),
      })
    );
  },

  async disputePayment(paymentId: string, reason: string): Promise<ApiResponse<Payment>> {
    return safeCall(() =>
      authFetch(`/renter/payments/${paymentId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  async listPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return safeCall(() => authFetch('/renter/payments/methods'));
  },

  async addPaymentMethod(data: {
    type: string;
    name: string;
    last4?: string;
    expiry?: string;
  }): Promise<ApiResponse<PaymentMethod>> {
    return safeCall(() =>
      authFetch('/renter/payments/methods', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async setDefaultPaymentMethod(id: string): Promise<ApiResponse<PaymentMethod[]>> {
    return safeCall(() => authFetch(`/renter/payments/methods/${id}/default`, { method: 'PATCH' }));
  },

  async removePaymentMethod(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/payments/methods/${id}`, { method: 'DELETE' }));
  },

  // ---- Maintenance ----
  async listMaintenanceRequests(): Promise<ApiResponse<MaintenanceRequest[]>> {
    return safeCall(() => authFetch('/renter/maintenance'));
  },

  async createMaintenanceRequest(data: {
    title: string;
    category: string;
    priority: string;
    description: string;
  }): Promise<ApiResponse<MaintenanceRequest>> {
    return safeCall(() =>
      authFetch('/renter/maintenance', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async cancelMaintenanceRequest(id: string): Promise<ApiResponse<MaintenanceRequest>> {
    return safeCall(() => authFetch(`/renter/maintenance/${id}/cancel`, { method: 'PATCH' }));
  },

  async rateVendor(id: string, rating: number): Promise<ApiResponse<MaintenanceRequest>> {
    return safeCall(() =>
      authFetch(`/renter/maintenance/${id}/rate-vendor`, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
      })
    );
  },

  // ---- Notifications ----
  async listNotifications(): Promise<ApiResponse<Notification[]>> {
    return safeCall(() => authFetch('/renter/notifications'));
  },

  async markNotificationAsRead(id: string): Promise<ApiResponse<Notification>> {
    return safeCall(() => authFetch(`/renter/notifications/${id}/read`, { method: 'PATCH' }));
  },

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch('/renter/notifications/read-all', { method: 'POST' }));
  },

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/notifications/${id}`, { method: 'DELETE' }));
  },

  async clearAllNotifications(): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch('/renter/notifications', { method: 'DELETE' }));
  },

  async listNotificationPreferences(): Promise<ApiResponse<NotificationPreference[]>> {
    return safeCall(() => authFetch('/renter/notifications/preferences'));
  },

  async updateNotificationPreference(
    category: string,
    data: { email?: boolean; push?: boolean; inApp?: boolean }
  ): Promise<ApiResponse<NotificationPreference>> {
    return safeCall(() =>
      authFetch(`/renter/notifications/preferences/${category}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  // ---- Dashboard ----
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return safeCall(() => authFetch('/renter/dashboard/stats'));
  },

  // ---- Settings ----
  async getProfile(): Promise<ApiResponse<RenterProfile>> {
    return safeCall(() => authFetch('/renter/profile'));
  },

  async updateProfile(data: {
    fullName?: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse<RenterProfile>> {
    return safeCall(() =>
      authFetch('/renter/profile', { method: 'PUT', body: JSON.stringify(data) })
    );
  },

  async updateAvatar(file: File): Promise<ApiResponse<RenterProfile>> {
    const formData = new FormData();
    formData.append('file', file);
    return safeCall(() => authFetch('/renter/profile/avatar', { method: 'POST', body: formData }));
  },

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      authFetch('/renter/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
    );
  },

  async exportData(): Promise<ApiResponse<Record<string, unknown>>> {
    return safeCall(() => authFetch('/renter/settings/data-export'));
  },

  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      authFetch('/renter/settings/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      })
    );
  },

  // ---- Saved searches ----
  async listSavedSearches(): Promise<ApiResponse<SavedSearch[]>> {
    return safeCall(() => authFetch('/renter/saved-searches'));
  },

  async createSavedSearch(data: {
    name: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    verifiedOnly?: boolean;
  }): Promise<ApiResponse<SavedSearch>> {
    return safeCall(() =>
      authFetch('/renter/saved-searches', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async toggleSavedSearchAlerts(id: string): Promise<ApiResponse<SavedSearch>> {
    return safeCall(() => authFetch(`/renter/saved-searches/${id}/alerts`, { method: 'PATCH' }));
  },

  async deleteSavedSearch(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/saved-searches/${id}`, { method: 'DELETE' }));
  },

  // ---- Move-in checklist ----
  async getMoveInChecklist(): Promise<ApiResponse<MoveInChecklistItem[]>> {
    return safeCall(() => authFetch('/renter/dashboard/move-in-checklist'));
  },

  async toggleMoveInChecklistItem(key: string): Promise<ApiResponse<MoveInChecklistItem>> {
    return safeCall(() =>
      authFetch(`/renter/dashboard/move-in-checklist/${key}/toggle`, { method: 'PATCH' })
    );
  },
};
