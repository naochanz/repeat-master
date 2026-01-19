import { create } from 'zustand';

interface AnalyticsStore {
  needsRefresh: boolean;
  setNeedsRefresh: (value: boolean) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  needsRefresh: false,
  setNeedsRefresh: (value: boolean) => set({ needsRefresh: value }),
}));
