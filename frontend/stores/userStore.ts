import { create } from 'zustand';
import { User, StudyRecord } from '@/types/user';
import { userDomain } from '@/domain/userDomain';
import { studyRecordDomain } from '@/domain/studyRecordDomain';

interface ActivityData {
    date: string;
    count: number;
}

interface UserStore {
    user: User | null;
    recentStudyRecords: StudyRecord[];
    activityData: ActivityData[];
    isLoading: boolean;

    fetchUser: () => Promise<void>;
    updateUserGoal: (goal: string) => Promise<void>;
    fetchRecentStudyRecords: () => Promise<void>;
    fetchActivity: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    recentStudyRecords: [],
    activityData: [],
    isLoading: false,

    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const user = await userDomain.fetchMe();
            set({ user, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch user:', error);
            set({ isLoading: false });
        }
    },
    updateUserGoal: async (goal: string) => {
        try {
            const user = await userDomain.updateGoal(goal);
            set({ user });
        } catch (error) {
            console.error('Failed to update goal:', error);
            throw error;
        }
    },

    fetchRecentStudyRecords: async () => {
        try {
            const recentStudyRecords = await studyRecordDomain.fetchRecent();
            set({ recentStudyRecords });
        } catch (error) {
            console.error('Failed to fetch recent study records:', error);
        }
    },

    fetchActivity: async () => {
        try {
            const activityData = await studyRecordDomain.fetchActivity();
            set({ activityData });
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        }
    },
}));
