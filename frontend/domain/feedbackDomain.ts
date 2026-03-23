import { supabase } from '@/lib/supabase';
import { feedbackRepository } from '@/repositories/feedbackRepository';

export const feedbackDomain = {
  async submitFeedback(message: string): Promise<void> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error('フィードバック内容を入力してください');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('ログインが必要です');
    }

    await feedbackRepository.insert(user.id, trimmed);
  },
};
