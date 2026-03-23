import { supabase } from '@/lib/supabase';
import { categoryRepository } from '@/repositories/categoryRepository';
import { Category } from '@/types/QuizBook';

export const categoryDomain = {
  async fetchAll(): Promise<Category[]> {
    return categoryRepository.findAll();
  },

  async create(name: string): Promise<Category> {
    const existing = await categoryRepository.findByName(name);
    if (existing) {
      throw new Error('同じ名前のカテゴリが既に存在します');
    }
    return categoryRepository.create(name);
  },

  async update(id: string, name: string): Promise<Category> {
    return categoryRepository.update(id, { name });
  },

  async remove(id: string): Promise<void> {
    // カテゴリに属するquiz_booksを先に削除（CASCADEで章・節・回答も削除）
    const { error: quizBooksError } = await supabase
      .from('quiz_books')
      .delete()
      .eq('category_id', id);

    if (quizBooksError) throw quizBooksError;

    await categoryRepository.remove(id);
  },
};
