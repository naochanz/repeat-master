import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/caseConverter';
import { QuestionAnswer, Attempt } from '@/types/QuizBook';

export const answerRepository = {
  async findByQuestion(
    questionNumber: number,
    chapterId?: string,
    sectionId?: string,
  ): Promise<{ id: string; attempts: Attempt[] } | null> {
    let query = supabase
      .from('question_answers')
      .select('*')
      .eq('question_number', questionNumber);

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    } else if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    }

    const { data } = await query.maybeSingle();
    if (!data) return null;
    return { id: data.id, attempts: (data.attempts as unknown as Attempt[]) || [] };
  },

  async create(params: {
    questionNumber: number;
    chapterId?: string;
    sectionId?: string;
    attempts: Attempt[];
  }): Promise<QuestionAnswer> {
    const { data, error } = await supabase
      .from('question_answers')
      .insert({
        question_number: params.questionNumber,
        chapter_id: params.chapterId || null,
        section_id: params.sectionId || null,
        attempts: params.attempts as any,
      })
      .select()
      .single();

    if (error) throw error;
    return keysToCamel<QuestionAnswer>(data);
  },

  async updateAttempts(id: string, attempts: Attempt[]): Promise<QuestionAnswer> {
    const { data, error } = await supabase
      .from('question_answers')
      .update({ attempts: attempts as any })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return keysToCamel<QuestionAnswer>(data);
  },

  async updateMemo(id: string, memo: string): Promise<void> {
    const { error } = await supabase
      .from('question_answers')
      .update({ memo })
      .eq('id', id);

    if (error) throw error;
  },

  async updateBookmark(id: string, isBookmarked: boolean): Promise<void> {
    const { error } = await supabase
      .from('question_answers')
      .update({ is_bookmarked: isBookmarked })
      .eq('id', id);

    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('question_answers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async findById(id: string): Promise<{ id: string; attempts: Attempt[] } | null> {
    const { data } = await supabase
      .from('question_answers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!data) return null;
    return { id: data.id, attempts: (data.attempts as unknown as Attempt[]) || [] };
  },
};
