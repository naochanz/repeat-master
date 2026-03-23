import { create } from 'zustand';
import { subscriptionService } from '@/services/subscription';
import { PurchasesPackage } from 'react-native-purchases';

interface SubscriptionStore {
  isAdFree: boolean;
  isLoading: boolean;
  packages: PurchasesPackage[];

  initialize: (userId?: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  purchaseRemoveAds: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  isAdFree: false,
  isLoading: true,
  packages: [],

  initialize: async (userId?: string) => {
    set({ isLoading: true });
    try {
      await subscriptionService.initialize(userId);
      if (subscriptionService.isInitialized) {
        await get().refreshStatus();
      }
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshStatus: async () => {
    try {
      const status = await subscriptionService.getStatus();
      set({ isAdFree: status.isAdFree });
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

  purchaseRemoveAds: async (pkg: PurchasesPackage): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const status = await subscriptionService.purchasePackage(pkg);
      set({ isAdFree: status.isAdFree });
      return status.isAdFree;
    } catch (error: any) {
      if (error.message === 'CANCELLED') return false;
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  restorePurchases: async () => {
    if (!subscriptionService.isInitialized) return false;

    set({ isLoading: true });
    try {
      const status = await subscriptionService.restorePurchases();
      set({ isAdFree: status.isAdFree });
      return status.isAdFree;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await subscriptionService.logout();
    set({ isAdFree: false, packages: [] });
  },
}));
