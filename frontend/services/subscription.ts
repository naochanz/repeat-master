import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

// Entitlement ID (RevenueCat ダッシュボードで設定)
export const ENTITLEMENT_AD_FREE = 'ad_free';

// 製品ID
export const PRODUCT_ID_REMOVE_ADS = 'com.naochanz.remove_ads';

export interface SubscriptionStatus {
  isAdFree: boolean;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  isAdFree: false,
};

class SubscriptionService {
  private initialized = false;

  get isConfigured(): boolean {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    return !!apiKey;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn('RevenueCat API key not configured - running with ads');
      return;
    }

    try {
      Purchases.configure({ apiKey });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  async login(userId: string): Promise<void> {
    if (!this.initialized) return;
    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Failed to login to RevenueCat:', error);
    }
  }

  async logout(): Promise<void> {
    if (!this.initialized) return;
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }

  async getStatus(): Promise<SubscriptionStatus> {
    if (!this.initialized) return DEFAULT_STATUS;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return DEFAULT_STATUS;
    }
  }

  async getOfferings(): Promise<PurchasesPackage[]> {
    if (!this.initialized) return [];

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<SubscriptionStatus> {
    if (!this.initialized) throw new Error('RevenueCat not initialized');

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.parseCustomerInfo(customerInfo);
    } catch (error: any) {
      if (error.userCancelled) throw new Error('CANCELLED');
      throw error;
    }
  }

  async restorePurchases(): Promise<SubscriptionStatus> {
    if (!this.initialized) return DEFAULT_STATUS;

    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionStatus {
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_AD_FREE];
    return { isAdFree: !!entitlement };
  }

  addCustomerInfoUpdateListener(callback: (status: SubscriptionStatus) => void): () => void {
    if (!this.initialized) return () => {};

    const listener = (customerInfo: CustomerInfo) => {
      callback(this.parseCustomerInfo(customerInfo));
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => Purchases.removeCustomerInfoUpdateListener(listener);
  }
}

export const subscriptionService = new SubscriptionService();
