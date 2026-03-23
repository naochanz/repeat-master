import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/caseConverter';
import { Section } from '@/types/QuizBook';

export const sectionRepository = {
  async create(chapterId: string, sectionNumber: number, title?: string, questionCount?: number): Promise<Section> {
    const { data, error } = await supabase
      .from('sections')
      .insert({
        chapter_id: chapterId,
        section_number: sectionNumber,
        title: title || null,
        question_count: questionCount || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return keysToCamel<Section>(data);
  },

  async update(sectionId: string, updates: Record<string, any>): Promise<Section> {
    const updateData: Record<string, any> = {};
    if (updates.sectionNumber !== undefined) updateData.section_number = updates.sectionNumber;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.questionCount !== undefined) updateData.question_count = updates.questionCount;

    const { data, error } = await supabase
      .from('sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error || !data) throw new Error('節が見つかりません');
    return keysToCamel<Section>(data);
  },

  async remove(sectionId: string): Promise<void> {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId);

    if (error) throw error;
  },
};
