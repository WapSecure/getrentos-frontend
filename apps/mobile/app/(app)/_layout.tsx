import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false } as const;
const PORTAL_UNAVAILABLE_OPTIONS = { presentation: 'modal' } as const;
const DETAIL_OPTIONS = { animation: 'slide_from_right' } as const;

/**
 * Authenticated shell. No redirect here — the root `useProtectedRoute` keeps an
 * anonymous user out and routes unbuilt portals to the holding screen. This
 * layout just declares the navigator.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="(renter)" />
      <Stack.Screen name="(landlord)" />
      <Stack.Screen name="(resident)" />
      <Stack.Screen name="(gateman)" />
      <Stack.Screen name="(agent)" />
      <Stack.Screen name="agent-task/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-inspection/[taskId]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-verification/[taskId]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-conversation/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-properties" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-documents" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-reviews" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-trust-profile" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-inspections" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-verifications" options={DETAIL_OPTIONS} />
      <Stack.Screen name="agent-sync" options={DETAIL_OPTIONS} />
      <Stack.Screen name="help" options={DETAIL_OPTIONS} />
      <Stack.Screen name="land" options={DETAIL_OPTIONS} />
      <Stack.Screen name="land-listing/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="shortlets" options={DETAIL_OPTIONS} />
      <Stack.Screen name="shortlet/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="shortlet-bookings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="shortlet-wishlist" options={DETAIL_OPTIONS} />
      <Stack.Screen name="(buyer)" />
      <Stack.Screen name="buyer-listing/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-offer/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-conversation/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-profile" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-saved" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-viewings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-transactions" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-documents" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-reviews" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-trust-profile" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-payment-method" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-search-preferences" options={DETAIL_OPTIONS} />
      <Stack.Screen name="buyer-notifications" options={DETAIL_OPTIONS} />
      <Stack.Screen name="property/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="property/[id]/apply" options={DETAIL_OPTIONS} />
      <Stack.Screen name="application/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="saved" options={DETAIL_OPTIONS} />
      <Stack.Screen name="saved-searches" options={DETAIL_OPTIONS} />
      <Stack.Screen name="viewings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="lease" options={DETAIL_OPTIONS} />
      <Stack.Screen name="renter-maintenance" options={DETAIL_OPTIONS} />
      <Stack.Screen name="report-maintenance" options={DETAIL_OPTIONS} />
      <Stack.Screen name="documents" options={DETAIL_OPTIONS} />
      <Stack.Screen name="roommates" options={DETAIL_OPTIONS} />
      <Stack.Screen name="support" options={DETAIL_OPTIONS} />
      <Stack.Screen name="support-thread/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="calendar" options={DETAIL_OPTIONS} />
      <Stack.Screen name="move-checklist" options={DETAIL_OPTIONS} />
      <Stack.Screen name="financing" options={DETAIL_OPTIONS} />
      <Stack.Screen name="credit-reporting" options={DETAIL_OPTIONS} />
      <Stack.Screen name="inspections" options={DETAIL_OPTIONS} />
      <Stack.Screen name="referrals" options={DETAIL_OPTIONS} />
      <Stack.Screen name="data-export" options={DETAIL_OPTIONS} />
      <Stack.Screen name="payments" options={DETAIL_OPTIONS} />
      <Stack.Screen name="payment-methods" options={DETAIL_OPTIONS} />
      <Stack.Screen name="receipts" options={DETAIL_OPTIONS} />
      <Stack.Screen name="trust-score" options={DETAIL_OPTIONS} />
      <Stack.Screen name="conversation/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="verify-identity" options={DETAIL_OPTIONS} />
      <Stack.Screen name="violations" options={DETAIL_OPTIONS} />
      <Stack.Screen name="deliveries" options={DETAIL_OPTIONS} />
      <Stack.Screen name="directory" options={DETAIL_OPTIONS} />
      <Stack.Screen name="polls" options={DETAIL_OPTIONS} />
      <Stack.Screen name="committee" options={DETAIL_OPTIONS} />
      <Stack.Screen name="visitor-passes" options={DETAIL_OPTIONS} />
      <Stack.Screen name="amenities" options={DETAIL_OPTIONS} />
      <Stack.Screen name="maintenance" options={DETAIL_OPTIONS} />
      <Stack.Screen name="dues" options={DETAIL_OPTIONS} />
      <Stack.Screen name="governance" options={DETAIL_OPTIONS} />
      <Stack.Screen name="edit-profile" options={DETAIL_OPTIONS} />
      <Stack.Screen name="notifications" options={DETAIL_OPTIONS} />
      <Stack.Screen name="notification-settings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="reviews" options={DETAIL_OPTIONS} />
      <Stack.Screen name="message-tools" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-property/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-applications" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-leases" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-maintenance" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-payments" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-financials" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-expenses" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-owner-statements" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-listings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-leads" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-microsite" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-evictions" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-reviews" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-documents" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-notifications" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-vendors" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-settings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="landlord-conversation/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="privacy-settings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="whatsapp-settings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="ussd" options={DETAIL_OPTIONS} />
      <Stack.Screen name="security-settings" options={DETAIL_OPTIONS} />
      <Stack.Screen name="portal-unavailable" options={PORTAL_UNAVAILABLE_OPTIONS} />
    </Stack>
  );
}
