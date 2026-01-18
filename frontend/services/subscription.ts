import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys (App Store Connect/Play Console で設定後に置き換え)
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

// Entitlement ID (RevenueCat ダッシュボードで設定)
export const ENTITLEMENT_ID = 'DORILOOP Pro';

// 製品ID (App Store Connect)
export const PRODUCT_ID_MONTHLY = 'com.DORILOOP.premium.monthly';
export const PRODUCT_ID_YEARLY = 'com.DORILOOP.premium.yearly';
export const PRODUCT_ID_ADD_QUIZBOOK = 'add_quizbook';

export interface SubscriptionStatus {
  isPremium: boolean;
  expirationDate: string | null;
  willRenew: boolean;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  isPremium: false,
  expirationDate: null,
  willRenew: false,
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
      console.warn('RevenueCat API key not configured - running in free mode');
      return;
    }

    try {
      Purchases.configure({ apiKey });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  async login(userId: string): Promise<void> {
    if (!this.initialized) {
      console.warn('RevenueCat not initialized, skipping login');
      return;
    }

    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Failed to login to RevenueCat:', error);
    }
  }

  async logout(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    // SDK未初期化の場合はデフォルト値を返す（無料扱い）
    if (!this.initialized) {
      return DEFAULT_STATUS;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return DEFAULT_STATUS;
    }
  }

  async getOfferings(): Promise<PurchasesPackage[]> {
    if (!this.initialized) {
      return [];
    }

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
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.parseCustomerInfo(customerInfo);
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('CANCELLED');
      }
      console.error('Failed to purchase:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<SubscriptionStatus> {
    if (!this.initialized) {
      return DEFAULT_STATUS;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionStatus {
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (entitlement) {
      return {
        isPremium: true,
        expirationDate: entitlement.expirationDate || null,
        willRenew: entitlement.willRenew,
      };
    }

    return DEFAULT_STATUS;
  }

  // リスナーを追加（購入状態の変更を監視）
  addCustomerInfoUpdateListener(callback: (status: SubscriptionStatus) => void): () => void {
    if (!this.initialized) {
      // 未初期化の場合は何もしないリムーバーを返す
      return () => {};
    }

    const listener = (customerInfo: CustomerInfo) => {
      callback(this.parseCustomerInfo(customerInfo));
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }
}

export const subscriptionService = new SubscriptionService();
