import { create } from 'zustand';
import { subscriptionService, SubscriptionStatus, ENTITLEMENT_ID } from '@/services/subscription';
import { PurchasesPackage } from 'react-native-purchases';
import { quizBookApi } from '@/services/api';

interface SubscriptionStore {
  // 状態
  isPremium: boolean;
  isLoading: boolean;
  expirationDate: string | null;
  willRenew: boolean;
  activeProductId: string | null;
  packages: PurchasesPackage[];
  activeQuizBookCount: number;
  purchasedSlots: number;  // 買い切りで購入した追加枠

  // 無料プランの制限
  FREE_ACTIVE_LIMIT: number;

  // アクション
  initialize: (userId?: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; isAddQuizBook: boolean }>;
  restorePurchases: () => Promise<boolean>;
  fetchActiveQuizBookCount: () => Promise<void>;
  canCreateQuizBook: () => boolean;
  logout: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  isPremium: false,
  isLoading: true,
  expirationDate: null,
  willRenew: false,
  activeProductId: null,
  packages: [],
  activeQuizBookCount: 0,
  purchasedSlots: 0,
  FREE_ACTIVE_LIMIT: 1,

  initialize: async (userId?: string) => {
    set({ isLoading: true });
    try {
      await subscriptionService.initialize(userId);
      // APIキーが設定されている場合のみステータスを取得
      if (subscriptionService.isInitialized) {
        await get().refreshStatus();
      }
      await get().fetchActiveQuizBookCount();
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshStatus: async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      const purchasedSlots = await subscriptionService.getPurchasedQuizBookSlots();
      set({
        isPremium: status.isPremium,
        expirationDate: status.expirationDate,
        willRenew: status.willRenew,
        activeProductId: status.activeProductId,
        purchasedSlots,
      });
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
    }
  },

  fetchPackages: async () => {
    try {
      const packages = await subscriptionService.getOfferings();
      set({ packages });
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  },

  purchasePackage: async (pkg: PurchasesPackage): Promise<{ success: boolean; isAddQuizBook: boolean }> => {
    set({ isLoading: true });
    const isAddQuizBook = pkg.product.identifier.includes('add_quizbook');
    try {
      const status = await subscriptionService.purchasePackage(pkg);
      // 買い切り商品の場合、追加枠を更新
      const purchasedSlots = await subscriptionService.getPurchasedQuizBookSlots();
      set({
        isPremium: status.isPremium,
        expirationDate: status.expirationDate,
        willRenew: status.willRenew,
        activeProductId: status.activeProductId,
        purchasedSlots,
      });

      if (isAddQuizBook) {
        return { success: purchasedSlots > 0, isAddQuizBook: true };
      }
      return { success: status.isPremium, isAddQuizBook: false };
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        return { success: false, isAddQuizBook };
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  restorePurchases: async () => {
    if (!subscriptionService.isInitialized) {
      console.warn('RevenueCat not initialized, cannot restore purchases');
      return false;
    }

    set({ isLoading: true });
    try {
      const status = await subscriptionService.restorePurchases();
      set({
        isPremium: status.isPremium,
        expirationDate: status.expirationDate,
        willRenew: status.willRenew,
      });
      return status.isPremium;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveQuizBookCount: async () => {
    try {
      const response = await quizBookApi.getActiveCount();
      set({ activeQuizBookCount: response.data });
    } catch (error) {
      console.error('Failed to fetch active quiz book count:', error);
    }
  },

  canCreateQuizBook: () => {
    const { isPremium, activeQuizBookCount, FREE_ACTIVE_LIMIT, purchasedSlots } = get();
    if (isPremium) return true;
    // 無料枠 + 買い切りで購入した追加枠
    const totalLimit = FREE_ACTIVE_LIMIT + purchasedSlots;
    return activeQuizBookCount < totalLimit;
  },

  logout: async () => {
    await subscriptionService.logout();
    set({
      isPremium: false,
      expirationDate: null,
      willRenew: false,
      activeProductId: null,
      packages: [],
      activeQuizBookCount: 0,
      purchasedSlots: 0,
    });
  },
}));
