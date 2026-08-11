import { authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { Property, Application } from '@/types/renter';
import type { ApplicationFormData } from '@/components/renter/property-apply/ApplicationWizard';
import type { CalendarEvent, CalendarEventFormData } from '@/types/calendar';
import type { VerificationItem, TrustScoreHistoryItem, Badge } from '@/types/trust-score';
import type { Conversation, Reminder } from '@/types/messages';

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
};
