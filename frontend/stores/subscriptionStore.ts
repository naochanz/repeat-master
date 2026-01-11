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
  packages: PurchasesPackage[];
  activeQuizBookCount: number;

  // 無料プランの制限
  FREE_ACTIVE_LIMIT: number;

  // アクション
  initialize: (userId?: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
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
  packages: [],
  activeQuizBookCount: 0,
  FREE_ACTIVE_LIMIT: 1,

  initialize: async (userId?: string) => {
    set({ isLoading: true });
    try {
      await subscriptionService.initialize(userId);
      await get().refreshStatus();
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
      set({
        isPremium: status.isPremium,
        expirationDate: status.expirationDate,
        willRenew: status.willRenew,
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

  purchasePackage: async (pkg: PurchasesPackage) => {
    set({ isLoading: true });
    try {
      const status = await subscriptionService.purchasePackage(pkg);
      set({
        isPremium: status.isPremium,
        expirationDate: status.expirationDate,
        willRenew: status.willRenew,
      });
      return status.isPremium;
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        return false;
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  restorePurchases: async () => {
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
    const { isPremium, activeQuizBookCount, FREE_ACTIVE_LIMIT } = get();
    if (isPremium) return true;
    return activeQuizBookCount < FREE_ACTIVE_LIMIT;
  },

  logout: async () => {
    await subscriptionService.logout();
    set({
      isPremium: false,
      expirationDate: null,
      willRenew: false,
      packages: [],
      activeQuizBookCount: 0,
    });
  },
}));
