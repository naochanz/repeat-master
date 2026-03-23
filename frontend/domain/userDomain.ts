import { supabase } from '@/lib/supabase';
import { userRepository } from '@/repositories/userRepository';
import { User } from '@/types/user';

export const userDomain = {
  async fetchMe(): Promise<User> {
    return userRepository.findMe();
  },

  async updateGoal(goal: string): Promise<User> {
    return userRepository.updateGoal(goal);
  },

  async deleteAccount(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('ログインが必要です');

    const { error } = await supabase.functions.invoke('delete-account', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw error;

    await supabase.auth.signOut();
  },
};
