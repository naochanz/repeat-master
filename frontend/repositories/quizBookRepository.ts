import { supabase } from '@/lib/supabase';
import { keysToCamel, keysToSnake } from '@/lib/caseConverter';
import { QuizBook } from '@/types/QuizBook';
import { Database } from '@/types/database';

const QUIZ_BOOK_SELECT = `
  *,
  category:categories(*),
  chapters(
    *,
    sections(*, question_answers!section_id(*)),
    question_answers!chapter_id(*)
  )
`;

export const quizBookRepository = {
  async findAll(): Promise<QuizBook[]> {
    const { data, error } = await supabase
      .from('quiz_books')
      .select(QUIZ_BOOK_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => keysToCamel<QuizBook>(row));
  },

  async findOne(id: string): Promise<QuizBook> {
    const { data, error } = await supabase
      .from('quiz_books')
      .select(QUIZ_BOOK_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) throw new Error('問題集が見つかりません');
    return keysToCamel<QuizBook>(data);
  },

  async create(params: {
    title: string;
    categoryId: string;
    useSections: boolean;
    isbn?: string;
    thumbnailUrl?: string;
  }): Promise<QuizBook> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ログインが必要です');

    const { data, error } = await supabase
      .from('quiz_books')
      .insert({
        title: params.title,
        category_id: params.categoryId,
        use_sections: params.useSections,
        isbn: params.isbn || null,
        thumbnail_url: params.thumbnailUrl || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...keysToCamel<QuizBook>(data), chapters: [] };
  },

  async update(id: string, updates: Record<string, any>): Promise<void> {
    const snakeUpdates = keysToSnake<Record<string, any>>(updates);
    const { error } = await supabase
      .from('quiz_books')
      .update(snakeUpdates as Database['public']['Tables']['quiz_books']['Update'])
      .eq('id', id);

    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('quiz_books')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async complete(id: string): Promise<void> {
    const { error } = await supabase
      .from('quiz_books')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async reactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('quiz_books')
      .update({ completed_at: null })
      .eq('id', id);

    if (error) throw error;
  },

  async countActive(): Promise<number> {
    const { count, error } = await supabase
      .from('quiz_books')
      .select('*', { count: 'exact', head: true })
      .is('completed_at', null);

    if (error) throw error;
    return count || 0;
  },
};
