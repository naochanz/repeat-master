import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/caseConverter';
import { Category } from '@/types/QuizBook';
import { Database } from '@/types/database';

type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map((row) => keysToCamel<Category>(row));
  },

  async create(name: string, description?: string): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ログインが必要です');

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, description, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return keysToCamel<Category>(data);
  },

  async update(id: string, fields: CategoryUpdate): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return keysToCamel<Category>(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async findByName(name: string): Promise<Category | null> {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    return data ? keysToCamel<Category>(data) : null;
  },
};
