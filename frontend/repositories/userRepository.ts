import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/caseConverter';
import { User } from '@/types/user';

export const userRepository = {
  async findMe(): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ログインが必要です');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) throw new Error('ユーザーが見つかりません');
    return keysToCamel<User>(data);
  },

  async updateGoal(goal: string): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ログインが必要です');

    const { data, error } = await supabase
      .from('profiles')
      .update({ goal })
      .eq('id', user.id)
      .select()
      .single();

    if (error || !data) throw new Error('ユーザーが見つかりません');
    return keysToCamel<User>(data);
  },
};
