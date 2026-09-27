import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

/**
 * Pro bought through Apple / Google, via RevenueCat.
 *
 * RevenueCat is logged in with OUR user id, so its webhook tells the API
 * exactly whose account to upgrade; the API is still the only thing that
 * decides entitlement. The public SDK keys are safe to ship in the app.
 */
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configuredFor: string | null = null;

/** False in Expo Go (no native module), on web, or before keys are set. */
export function purchasesAvailable(): boolean {
  return (
    !!API_KEY &&
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

/** Ties purchases to the signed-in account. Safe to call on every sign-in. */
export async function identifyPurchaser(userId: string): Promise<void> {
  if (!purchasesAvailable() || configuredFor === userId) return;
  try {
    if (!configuredFor) Purchases.configure({ apiKey: API_KEY!, appUserID: userId });
    else await Purchases.logIn(userId);
    configuredFor = userId;
  } catch {
    // Purchases stay unavailable this session; nothing else depends on them.
  }
}

/** On sign-out, so the next person on this phone doesn't inherit the purchaser. */
export async function forgetPurchaser(): Promise<void> {
  if (!configuredFor) return;
  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous.
  }
  configuredFor = null;
}

export interface ProOffer {
  id: string;
  /** e.g. "₦15,000" in the store's own currency formatting. */
  price: string;
  cycle: 'MONTHLY' | 'ANNUAL';
  pkg: PurchasesPackage;
}

/** The Pro plans on sale in this store, monthly first. */
export async function loadProOffers(): Promise<ProOffer[]> {
  if (!configuredFor) return [];
  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  return packages
    .map((pkg) => ({
      id: pkg.identifier,
      price: pkg.product.priceString,
      cycle: (pkg.packageType === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY') as ProOffer['cycle'],
      pkg,
    }))
    .sort((a, b) => (a.cycle === b.cycle ? 0 : a.cycle === 'MONTHLY' ? -1 : 1));
}

/** Runs the store's purchase sheet. Resolves false if the person backs out. */
export async function buyOffer(offer: ProOffer): Promise<boolean> {
  try {
    await Purchases.purchasePackage(offer.pkg);
    return true;
  } catch (err) {
    if ((err as { userCancelled?: boolean | null }).userCancelled) return false;
    throw err;
  }
}

/** For someone who bought Pro on another phone or reinstalled. */
export async function restorePurchases(): Promise<void> {
  if (!configuredFor) return;
  await Purchases.restorePurchases();
}

/** Opens the store's own subscription settings (cancel, change plan). */
export async function manageStoreSubscription(): Promise<void> {
  await Purchases.showManageSubscriptions();
}
