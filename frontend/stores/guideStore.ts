import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUIDE_COMPLETE_KEY = '@repeat_master_guide_complete';
const GUIDE_PROGRESS_KEY = '@repeat_master_guide_progress';

export type GuideStep =
  | 'library_tap_add'
  | 'library_tap_book'
  | 'study_tap_add_chapter'
  | 'study_tap_chapter'
  | 'complete';

const STEP_ORDER: GuideStep[] = [
  'library_tap_add',
  'library_tap_book',
  'study_tap_add_chapter',
  'study_tap_chapter',
  'complete',
];

interface GuideStore {
  isActive: boolean;
  isInitialized: boolean;
  currentStep: GuideStep;
  initialize: () => Promise<void>;
  advance: () => Promise<void>;
  complete: () => Promise<void>;
}

export const useGuideStore = create<GuideStore>((set, get) => ({
  isActive: false,
  isInitialized: false,
  currentStep: 'library_tap_add',

  initialize: async () => {
    if (get().isInitialized) return;
    set({ isInitialized: true });
    const done = await AsyncStorage.getItem(GUIDE_COMPLETE_KEY);
    if (done) {
      set({ isActive: false, currentStep: 'complete' });
      return;
    }
    const saved = await AsyncStorage.getItem(GUIDE_PROGRESS_KEY);
    const step = saved as GuideStep | null;
    if (step && STEP_ORDER.includes(step)) {
      set({ isActive: true, currentStep: step });
    } else {
      set({ isActive: true, currentStep: 'library_tap_add' });
    }
  },

  advance: async () => {
    const { currentStep } = get();
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) {
      const next = STEP_ORDER[idx + 1];
      if (next === 'complete') {
        await get().complete();
      } else {
        set({ currentStep: next });
        await AsyncStorage.setItem(GUIDE_PROGRESS_KEY, next);
      }
    }
  },

  complete: async () => {
    set({ isActive: false, currentStep: 'complete' });
    await AsyncStorage.setItem(GUIDE_COMPLETE_KEY, 'true');
    await AsyncStorage.removeItem(GUIDE_PROGRESS_KEY);
  },
}));
