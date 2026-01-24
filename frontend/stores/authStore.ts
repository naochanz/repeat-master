import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import * as AppleAuthentication from 'expo-apple-authentication';
import { subscriptionService } from '@/services/subscription';
import { useSubscriptionStore } from './subscriptionStore';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // アクション
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      // 現在のセッションを取得
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({
          user: session.user,
          session,
          isAuthenticated: true,
        });
        // RevenueCatにユーザーIDを紐づけ
        await subscriptionService.login(session.user.id);
        // サブスクリプション状態を更新
        await useSubscriptionStore.getState().refreshStatus();
        // プロファイルを取得
        await get().fetchProfile();
      }

      // 認証状態の変化をリッスン
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({
          user: session?.user ?? null,
          session,
          isAuthenticated: !!session,
        });

        if (session) {
          // RevenueCatにユーザーIDを紐づけ
          await subscriptionService.login(session.user.id);
          // サブスクリプション状態を更新
          await useSubscriptionStore.getState().refreshStatus();
          await get().fetchProfile();
        } else {
          // RevenueCatからログアウト
          await subscriptionService.logout();
          // サブスクリプション状態をリセット
          await useSubscriptionStore.getState().logout();
          set({ profile: null });
        }
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      set({ profile: data });
    }
  },

  updateProfile: async (data: Partial<Profile>) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) throw error;

    await get().fetchProfile();
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
      });

      // RevenueCatにユーザーIDを紐づけ
      if (data.user) {
        await subscriptionService.login(data.user.id);
        // サブスクリプション状態を更新
        await useSubscriptionStore.getState().refreshStatus();
      }

      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email: string, password: string, name?: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // 登録後、プロファイルに名前を設定
      if (data.user && name) {
        await supabase
          .from('profiles')
          .update({ name })
          .eq('id', data.user.id);
      }

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: !!data.session,
      });

      if (data.session) {
        await get().fetchProfile();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithApple: async () => {
    set({ isLoading: true });
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple Sign In failed - no identity token');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      // Appleから名前を取得できた場合、プロファイルを更新
      if (credential.fullName?.givenName && data.user) {
        const fullName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ');

        await supabase
          .from('profiles')
          .update({ name: fullName })
          .eq('id', data.user.id);
      }

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
      });

      // RevenueCatにユーザーIDを紐づけ
      if (data.user) {
        await subscriptionService.login(data.user.id);
        // サブスクリプション状態を更新
        await useSubscriptionStore.getState().refreshStatus();
      }

      await get().fetchProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    // RevenueCatからもログアウト
    await subscriptionService.logout();
    // サブスクリプション状態をリセット
    await useSubscriptionStore.getState().logout();
    await supabase.auth.signOut();
    set({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
    });
  },
}));
