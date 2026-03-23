import { supabase } from '@/lib/supabase';

export const feedbackRepository = {
  async insert(userId: string, message: string): Promise<void> {
    const { error } = await supabase.from('feedback').insert({
      user_id: userId,
      message,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};
