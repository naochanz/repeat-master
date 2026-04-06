import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/caseConverter';
import { Chapter } from '@/types/QuizBook';

export const chapterRepository = {
  async create(quizBookId: string, chapterNumber: number, title?: string, questionCount?: number): Promise<Chapter> {
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        quiz_book_id: quizBookId,
        chapter_number: chapterNumber,
        title: title || null,
        question_count: questionCount ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return keysToCamel<Chapter>(data);
  },

  async update(chapterId: string, updates: Record<string, any>): Promise<Chapter> {
    const updateData: Record<string, any> = {};
    if (updates.chapterNumber !== undefined) updateData.chapter_number = updates.chapterNumber;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.questionCount !== undefined) updateData.question_count = updates.questionCount;
    if (updates.currentRound !== undefined) updateData.current_round = updates.currentRound;

    const { data, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', chapterId)
      .select()
      .single();

    if (error || !data) throw new Error('章が見つかりません');
    return keysToCamel<Chapter>(data);
  },

  async remove(chapterId: string): Promise<void> {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);

    if (error) throw error;
  },
};
