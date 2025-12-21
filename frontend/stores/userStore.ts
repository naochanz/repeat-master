import { create } from 'zustand';
import { User, StudyRecord } from '@/types/user';
import { userApi, studyRecordApi } from '@/services/api';

interface UserStore {
    user: User | null;
    recentStudyRecords: StudyRecord[];
    isLoading: boolean;

    fetchUser: () => Promise<void>;
    updateUserGoal: (goal: string) => Promise<void>;
    fetchRecentStudyRecords: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    recentStudyRecords: [],
    isLoading: false,

    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const response = await userApi.getMe();
            set({ user: response.data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user:', error);
            set({ isLoading: false });
        }
    },
    updateUserGoal: async (goal: string) => {
        try {
            const response = await userApi.updateGoal(goal);
            set({ user: response.data });
        } catch (error) {
            console.error('Failed to update goal:', error);
            throw error;
        }
    },

    fetchRecentStudyRecords: async () => {
        try {
            const response = await studyRecordApi.getRecent();
            set({ recentStudyRecords: response.data });
        } catch (error) {
            console.error('Failed to fetch recent study records:', error);
        }
    },
}));