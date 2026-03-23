import { supabase } from '@/lib/supabase';

export const studyRecordRepository = {
  async findRecentWithQuizBook(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('study_records')
      .select(`
        *,
        quiz_book:quiz_books(
          id,
          title,
          category:categories(name)
        )
      `)
      .order('answered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async findChapterNumbers(chapterIds: string[]): Promise<Map<string, number>> {
    if (chapterIds.length === 0) return new Map();

    const { data } = await supabase
      .from('chapters')
      .select('id, chapter_number')
      .in('id', chapterIds);

    return new Map((data || []).map((c) => [c.id, c.chapter_number]));
  },

  async findSectionNumbers(sectionIds: string[]): Promise<Map<string, number>> {
    if (sectionIds.length === 0) return new Map();

    const { data } = await supabase
      .from('sections')
      .select('id, section_number')
      .in('id', sectionIds);

    return new Map((data || []).map((s) => [s.id, s.section_number]));
  },

  async findActivityAttempts(days: number = 105): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ユーザーの問題集 → 章 → 回答のattemptsを取得
    const { data: quizBooks } = await supabase
      .from('quiz_books')
      .select('id');

    if (!quizBooks || quizBooks.length === 0) return [];

    const { data: chapters } = await supabase
      .from('chapters')
      .select('id')
      .in('quiz_book_id', quizBooks.map((qb) => qb.id));

    if (!chapters || chapters.length === 0) return [];

    const { data, error } = await supabase
      .from('question_answers')
      .select('attempts')
      .in('chapter_id', chapters.map((c) => c.id));

    if (error) throw error;
    return data || [];
  },

  async insert(params: {
    userId: string;
    quizBookId: string;
    chapterId: string;
    questionNumber: number;
    result: '○' | '×';
    round: number;
    sectionId?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('study_records')
      .insert({
        user_id: params.userId,
        quiz_book_id: params.quizBookId,
        chapter_id: params.chapterId,
        section_id: params.sectionId || null,
        question_number: params.questionNumber,
        result: params.result,
        round: params.round,
        answered_at: new Date().toISOString(),
      });

    if (error) throw error;
  },
};
