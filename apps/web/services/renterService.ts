import { ApiError } from '@/lib/apiClient';
import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import { getAuthToken } from '@/lib/authStorage';
import type { Property, Application, GeoInsights, RenterInspection } from '@/types/renter';
import type { ApplicationFormData } from '@/components/renter/property-apply/ApplicationWizard';
import type { CalendarEvent, CalendarEventFormData } from '@/types/calendar';
import type { VerificationItem, TrustScoreHistoryItem, Badge } from '@/types/trust-score';
import type { Conversation, Reminder } from '@/types/messages';
import type { RenewalOffer } from '@/types/lease';
import type { CreateMaintenanceRequestInput, MaintenanceRequest } from '@/types/maintenance';
import type { Notification } from '@/types/notification';
import type { CreditBureau, CreditReportingProfile } from '@/types/credit-reporting';
import type { FinancingOverview, FinancingPlan, FinancingPlanLength } from '@/types/financing';
import type { UssdMenu } from '@/types/ussd';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

interface RenterInspectionApi {
  id: string;
  type: 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';
  scheduledAt: string;
  overallCondition: string | null;
  rooms: RenterInspection['rooms'];
  acknowledgedAt: string | null;
  property: { title: string; address: string };
}

export interface MoveInChecklistItem {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface MoveOutChecklistItem {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category?: string;
  useCount: number;
  createdAt: string;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  response: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  rating?: number;
  message: string;
  createdAt: string;
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

export interface PendingLease {
  id: string;
  propertyName: string;
  address: string;
  unitName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit?: number;
  landlord: { name: string; email: string; phone: string };
  tenantSigned: boolean;
  landlordSigned: boolean;
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
  phoneVerified?: boolean;
  avatarUrl?: string;
  location?: string;
  bio?: string;
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

export type ReviewCategory = 'LANDLORD' | 'PROPERTY';

export interface PendingReview {
  id: string;
  leaseId: string;
  category: ReviewCategory;
  propertyId?: string;
  property?: string;
  landlord?: string;
  moveOutDate: string;
  type: 'landlord' | 'property';
}

export interface ReviewItem {
  id: string;
  rating: number;
  category: string;
  comment?: string;
  reviewerName?: string;
  propertyTitle?: string;
  createdAt: string;
}

export type SavedListingItem = Property & {
  savedListingId: string;
  wishlistId: string | null;
  note: string | null;
  savedAt: string;
};

export interface ApplicationNote {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type RecentlyViewedItem = Property & { viewedAt: string };

export interface Wishlist {
  id: string;
  name: string;
  isDefault: boolean;
  count: number;
  createdAt: string;
}

export interface ApplicationAssistantStep {
  key: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface ApplicationAssistant {
  steps: ApplicationAssistantStep[];
  suggestion: string | null;
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
  averageScore: number;
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

  /** Real map + neighborhood/property insights for a listing (OpenStreetMap + optional AI). */
  async getGeoInsights(id: string, destination?: string): Promise<ApiResponse<GeoInsights>> {
    const query = destination ? `?destination=${encodeURIComponent(destination)}` : '';
    return safeCall(() => authFetch(`/renter/listings/${id}/geo-insights${query}`));
  },

  // ---- Saved listings ----
  async listSavedListings(): Promise<ApiResponse<SavedListingItem[]>> {
    return safeCall(() => authFetch('/renter/saved-listings'));
  },

  async saveListing(
    listingId: string,
    wishlistId?: string | null
  ): Promise<ApiResponse<{ saved: boolean }>> {
    return safeCall(() =>
      authFetch(`/renter/saved-listings/${listingId}`, {
        method: 'POST',
        body: JSON.stringify({ wishlistId: wishlistId ?? null }),
      })
    );
  },

  async unsaveListing(listingId: string): Promise<ApiResponse<{ saved: boolean }>> {
    return safeCall(() => authFetch(`/renter/saved-listings/${listingId}`, { method: 'DELETE' }));
  },

  async moveSavedListingToWishlist(
    savedListingId: string,
    wishlistId: string | null
  ): Promise<ApiResponse<{ updated: boolean }>> {
    return safeCall(() =>
      authFetch(`/renter/saved-listings/${savedListingId}/wishlist`, {
        method: 'PATCH',
        body: JSON.stringify({ wishlistId: wishlistId ?? null }),
      })
    );
  },

  async setSavedListingNote(
    savedListingId: string,
    note: string | null
  ): Promise<ApiResponse<{ updated: boolean; note: string | null }>> {
    return safeCall(() =>
      authFetch(`/renter/saved-listings/${savedListingId}/note`, {
        method: 'PATCH',
        body: JSON.stringify({ note: note ?? null }),
      })
    );
  },

  // ---- Wishlists ----
  async listWishlists(): Promise<ApiResponse<Wishlist[]>> {
    return safeCall(() => authFetch('/renter/wishlists'));
  },

  async createWishlist(name: string): Promise<ApiResponse<Wishlist>> {
    return safeCall(() =>
      authFetch('/renter/wishlists', { method: 'POST', body: JSON.stringify({ name }) })
    );
  },

  async renameWishlist(id: string, name: string): Promise<ApiResponse<Wishlist>> {
    return safeCall(() =>
      authFetch(`/renter/wishlists/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
    );
  },

  async deleteWishlist(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return safeCall(() => authFetch(`/renter/wishlists/${id}`, { method: 'DELETE' }));
  },

  // ---- Recently viewed ----
  async listRecentlyViewed(): Promise<ApiResponse<RecentlyViewedItem[]>> {
    return safeCall(() => authFetch('/renter/recently-viewed'));
  },

  async recordListingView(listingId: string): Promise<ApiResponse<{ recorded: boolean }>> {
    return safeCall(() => authFetch(`/renter/recently-viewed/${listingId}`, { method: 'POST' }));
  },

  // ---- Recommendations ----
  async getRecommendations(): Promise<ApiResponse<Property[]>> {
    return safeCall(() => authFetch('/renter/recommendations'));
  },

  // ---- Application assistant ----
  async getApplicationAssistant(): Promise<ApiResponse<ApplicationAssistant>> {
    return safeCall(() => authFetch('/renter/application-assistant'));
  },

  // ---- Applications ----
  async listMyApplications(): Promise<ApiResponse<Application[]>> {
    return safeCall(() => authFetch('/renter/applications'));
  },
  async withdrawApplication(id: string): Promise<ApiResponse<Application>> {
    return safeCall(() => authFetch(`/renter/applications/${id}/withdraw`, { method: 'PATCH' }));
  },

  async listApplicationNotes(applicationId: string): Promise<ApiResponse<ApplicationNote[]>> {
    return safeCall(() => authFetch(`/renter/applications/${applicationId}/notes`));
  },

  async listAllApplicationNotes(): Promise<ApiResponse<ApplicationNote[]>> {
    return safeCall(() => authFetch('/renter/applications/notes'));
  },

  async createApplicationNote(
    applicationId: string,
    content: string
  ): Promise<ApiResponse<ApplicationNote>> {
    return safeCall(() =>
      authFetch(`/renter/applications/${applicationId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
    );
  },

  async updateApplicationNote(
    applicationId: string,
    noteId: string,
    content: string
  ): Promise<ApiResponse<ApplicationNote>> {
    return safeCall(() =>
      authFetch(`/renter/applications/${applicationId}/notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      })
    );
  },

  async deleteApplicationNote(
    applicationId: string,
    noteId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      authFetch(`/renter/applications/${applicationId}/notes/${noteId}`, { method: 'DELETE' })
    );
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
          nextOfKinName: data.nextOfKinName || undefined,
          nextOfKinPhone: data.nextOfKinPhone || undefined,
          nextOfKinRelationship: data.nextOfKinRelationship || undefined,
          references: data.referenceName
            ? [
                {
                  name: data.referenceName,
                  phone: data.referencePhone,
                  relationship: data.referenceRelationship || 'Reference',
                },
              ]
            : undefined,
          documents: data.documents,
        }),
      })
    );
  },

  // ---- Roommates ----
  async listRoommates(): Promise<ApiResponse<Roommate[]>> {
    return safeCall(() => authFetch('/renter/roommates'));
  },

  // ---- Reviews ----
  async getPendingReviews(): Promise<ApiResponse<PendingReview[]>> {
    return safeCall(() => authFetch('/renter/reviews/pending'));
  },

  async getSubmittedReviews(): Promise<ApiResponse<ReviewItem[]>> {
    return safeCall(() => authFetch('/renter/reviews/submitted'));
  },

  async submitReview(data: {
    leaseId: string;
    category: 'LANDLORD' | 'PROPERTY';
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<ReviewItem>> {
    return safeCall(() =>
      authFetch('/renter/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
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

  // ---- Credit reporting ----
  async getCreditReporting(): Promise<ApiResponse<CreditReportingProfile>> {
    return safeCall(() => authFetch('/renter/credit-reporting'));
  },

  async enrollCreditReporting(bureau?: CreditBureau): Promise<ApiResponse<CreditReportingProfile>> {
    return safeCall(() =>
      authFetch('/renter/credit-reporting/enroll', {
        method: 'POST',
        body: JSON.stringify({ bureau: bureau ?? undefined }),
      })
    );
  },

  // ---- Flex financing ----
  async getFinancing(): Promise<ApiResponse<FinancingOverview>> {
    return safeCall(() => authFetch('/renter/financing'));
  },

  async applyFinancing(months: FinancingPlanLength): Promise<ApiResponse<FinancingOverview>> {
    return safeCall(() =>
      authFetch('/renter/financing/apply', {
        method: 'POST',
        body: JSON.stringify({ months }),
      })
    );
  },

  async payFinancingInstallment(installmentId: string): Promise<ApiResponse<FinancingPlan>> {
    return safeCall(() =>
      authFetch(`/renter/financing/installments/${installmentId}/pay`, { method: 'POST' })
    );
  },

  // ---- USSD ----
  async getUssdMenu(): Promise<ApiResponse<UssdMenu>> {
    return safeCall(() => authFetch('/renter/ussd/menu'));
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

  async startConversation(
    participantId: string,
    propertyId?: string
  ): Promise<ApiResponse<Conversation>> {
    return safeCall(() =>
      authFetch('/renter/messages', {
        method: 'POST',
        body: JSON.stringify({ participantId, propertyId: propertyId ?? undefined }),
      })
    );
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

  // ---- Message templates ----
  async listMessageTemplates(): Promise<ApiResponse<MessageTemplate[]>> {
    return safeCall(() => authFetch('/renter/messages/templates'));
  },

  async createMessageTemplate(data: {
    title: string;
    content: string;
    category?: string;
  }): Promise<ApiResponse<MessageTemplate>> {
    return safeCall(() =>
      authFetch('/renter/messages/templates', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async updateMessageTemplate(
    id: string,
    data: { title?: string; content?: string; category?: string; useCount?: number }
  ): Promise<ApiResponse<MessageTemplate>> {
    return safeCall(() =>
      authFetch(`/renter/messages/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    );
  },

  async deleteMessageTemplate(id: string): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() => authFetch(`/renter/messages/templates/${id}`, { method: 'DELETE' }));
  },

  // ---- Quick replies ----
  async listQuickReplies(): Promise<ApiResponse<QuickReply[]>> {
    return safeCall(() => authFetch('/renter/messages/quick-replies'));
  },

  async createQuickReply(data: {
    shortcut: string;
    response: string;
  }): Promise<ApiResponse<QuickReply>> {
    return safeCall(() =>
      authFetch('/renter/messages/quick-replies', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async updateQuickReply(
    id: string,
    data: { shortcut?: string; response?: string }
  ): Promise<ApiResponse<QuickReply>> {
    return safeCall(() =>
      authFetch(`/renter/messages/quick-replies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async deleteQuickReply(id: string): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() => authFetch(`/renter/messages/quick-replies/${id}`, { method: 'DELETE' }));
  },

  // ---- Help feedback ----
  async submitFeedback(data: { rating?: number; message: string }): Promise<ApiResponse<Feedback>> {
    return safeCall(() =>
      authFetch('/renter/feedback', { method: 'POST', body: JSON.stringify(data) })
    );
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

  async getPendingLease(): Promise<ApiResponse<PendingLease | null>> {
    return safeCall(() => authFetch('/renter/lease/pending'));
  },

  async signLease(id: string, signatureData: string): Promise<ApiResponse<PendingLease>> {
    return safeCall(() =>
      authFetch(`/renter/lease/${id}/sign`, {
        method: 'POST',
        body: JSON.stringify({ signatureData }),
      })
    );
  },

  async downloadLeasePdf(): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/renter/lease/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new ApiError(response.status, 'Failed to download lease PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lease.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
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

  async createMaintenanceRequest(
    data: CreateMaintenanceRequestInput
  ): Promise<ApiResponse<MaintenanceRequest>> {
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

  // ---- Inspections ----
  async listInspections(): Promise<ApiResponse<RenterInspection[]>> {
    const response = await safeCall(() => authFetch<RenterInspectionApi[]>('/renter/inspections'));
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.map((inspection) => ({
          id: inspection.id,
          type: inspection.type.toLowerCase() as RenterInspection['type'],
          scheduledDate: inspection.scheduledAt,
          propertyName: inspection.property.title,
          propertyAddress: inspection.property.address,
          overallCondition: (inspection.overallCondition?.toLowerCase() ||
            undefined) as RenterInspection['overallCondition'],
          rooms: inspection.rooms,
          acknowledgedAt: inspection.acknowledgedAt || undefined,
        })),
      };
    }
    return { success: false, error: response.error, message: response.message };
  },

  async acknowledgeInspection(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/renter/inspections/${id}/acknowledge`, { method: 'POST' }));
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
    location?: string;
    bio?: string;
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

  async sendPhoneVerification(): Promise<ApiResponse<{ reference: string }>> {
    return safeCall(() => authFetch('/renter/settings/phone/verify/send', { method: 'POST' }));
  },

  async confirmPhoneVerification(
    reference: string,
    otp: string
  ): Promise<ApiResponse<{ phoneVerified: boolean }>> {
    return safeCall(() =>
      authFetch('/renter/settings/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ reference, otp }),
      })
    );
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

  async getSettingsPreferences(): Promise<ApiResponse<Record<string, unknown>>> {
    return safeCall(() => authFetch('/renter/settings/preferences'));
  },

  async updateSettingsPreferences(
    preferences: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return safeCall(() =>
      authFetch('/renter/settings/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      })
    );
  },

  async exportData(): Promise<ApiResponse<Record<string, unknown>>> {
    return safeCall(() => authFetch('/renter/settings/data-export'));
  },

  async getTwoFactorStatus(): Promise<ApiResponse<{ enrolled: boolean; enabled: boolean }>> {
    return safeCall(() => authFetch('/renter/settings/2fa'));
  },

  async enrollTwoFactor(): Promise<
    ApiResponse<{ secret: string; otpauthUrl: string; qrDataUrl: string }>
  > {
    return safeCall(() => authFetch('/renter/settings/2fa/enroll', { method: 'POST' }));
  },

  async enableTwoFactor(token: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return safeCall(() =>
      authFetch('/renter/settings/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  },

  async disableTwoFactor(token: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return safeCall(() =>
      authFetch('/renter/settings/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
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

  // ---- Move-out checklist ----
  async getMoveOutChecklist(): Promise<ApiResponse<MoveOutChecklistItem[]>> {
    return safeCall(() => authFetch('/renter/dashboard/move-out-checklist'));
  },

  async toggleMoveOutChecklistItem(key: string): Promise<ApiResponse<MoveOutChecklistItem>> {
    return safeCall(() =>
      authFetch(`/renter/dashboard/move-out-checklist/${key}/toggle`, { method: 'PATCH' })
    );
  },
};
