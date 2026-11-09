import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

// RevenueCat is logged in with our user id so its webhook upgrades the right account; the API alone
// decides entitlement. The public SDK keys are safe to ship.
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configuredFor: string | null = null;

export function purchasesAvailable(): boolean {
  return (
    !!API_KEY &&
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

// Safe to call on every sign-in.
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

// On sign-out, so the next person on this phone doesn't inherit the purchaser.
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
  price: string;
  cycle: 'MONTHLY' | 'ANNUAL';
  pkg: PurchasesPackage;
}

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

export async function buyOffer(offer: ProOffer): Promise<boolean> {
  try {
    await Purchases.purchasePackage(offer.pkg);
    return true;
  } catch (err) {
    if ((err as { userCancelled?: boolean | null }).userCancelled) return false;
    throw err;
  }
}

export async function restorePurchases(): Promise<void> {
  if (!configuredFor) return;
  await Purchases.restorePurchases();
}

export async function manageStoreSubscription(): Promise<void> {
  await Purchases.showManageSubscriptions();
}
