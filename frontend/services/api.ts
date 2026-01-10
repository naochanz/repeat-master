import { supabase } from '@/lib/supabase';
import { keysToCamel } from '@/lib/caseConverter';
import { Attempt } from '@/types/database';

// カテゴリAPI
export const categoryApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  create: async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, description })
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  update: async (id: string, updateData: { name: string; description?: string }) => {
    const { data: updated, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(updated) };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { data: null };
  },
};

// QuizBook API
export const quizBookApi = {
  getAll: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('quiz_books')
      .select(`
        *,
        category:categories(*),
        chapters(
          *,
          sections(*),
          question_answers(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  getOne: async (id: string) => {
    const { data, error } = await supabase
      .from('quiz_books')
      .select(`
        *,
        category:categories(*),
        chapters(
          *,
          sections(
            *,
            question_answers(*)
          ),
          question_answers(*)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  create: async (title: string, categoryId: string, useSections: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('quiz_books')
      .insert({
        title,
        category_id: categoryId,
        use_sections: useSections,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  update: async (id: string, updateData: any) => {
    // キャメルケースをスネークケースに変換
    const snakeCaseData: Record<string, any> = {};
    if (updateData.title !== undefined) snakeCaseData.title = updateData.title;
    if (updateData.categoryId !== undefined) snakeCaseData.category_id = updateData.categoryId;
    if (updateData.chapterCount !== undefined) snakeCaseData.chapter_count = updateData.chapterCount;
    if (updateData.currentRate !== undefined) snakeCaseData.current_rate = updateData.currentRate;
    if (updateData.useSections !== undefined) snakeCaseData.use_sections = updateData.useSections;
    if (updateData.currentRound !== undefined) snakeCaseData.current_round = updateData.currentRound;

    const { data, error } = await supabase
      .from('quiz_books')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('quiz_books').delete().eq('id', id);
    if (error) throw error;
    return { data: null };
  },

  getAnalytics: async (id: string) => {
    const { data: quizBook, error } = await supabase
      .from('quiz_books')
      .select(`
        *,
        chapters(
          *,
          question_answers(*)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: keysToCamel(quizBook) };
  },
};

// Chapter API
export const chapterApi = {
  create: async (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) => {
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        quiz_book_id: quizBookId,
        chapter_number: chapterNumber,
        title,
        question_count: questionCount,
      })
      .select()
      .single();
    if (error) throw error;

    // quiz_bookのchapter_countを更新
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id')
      .eq('quiz_book_id', quizBookId);

    await supabase
      .from('quiz_books')
      .update({ chapter_count: chapters?.length || 0 })
      .eq('id', quizBookId);

    return { data: keysToCamel(data) };
  },

  update: async (quizBookId: string, chapterId: string, updateData: any) => {
    const snakeCaseData: Record<string, any> = {};
    if (updateData.chapterNumber !== undefined) snakeCaseData.chapter_number = updateData.chapterNumber;
    if (updateData.title !== undefined) snakeCaseData.title = updateData.title;
    if (updateData.chapterRate !== undefined) snakeCaseData.chapter_rate = updateData.chapterRate;
    if (updateData.questionCount !== undefined) snakeCaseData.question_count = updateData.questionCount;

    const { data, error } = await supabase
      .from('chapters')
      .update(snakeCaseData)
      .eq('id', chapterId)
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  delete: async (quizBookId: string, chapterId: string) => {
    const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
    if (error) throw error;

    // quiz_bookのchapter_countを更新
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id')
      .eq('quiz_book_id', quizBookId);

    await supabase
      .from('quiz_books')
      .update({ chapter_count: chapters?.length || 0 })
      .eq('id', quizBookId);

    return { data: null };
  },
};

// Section API
export const sectionApi = {
  create: async (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) => {
    const { data, error } = await supabase
      .from('sections')
      .insert({
        chapter_id: chapterId,
        section_number: sectionNumber,
        title,
        question_count: questionCount || 0,
      })
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  update: async (quizBookId: string, chapterId: string, sectionId: string, updateData: any) => {
    const snakeCaseData: Record<string, any> = {};
    if (updateData.sectionNumber !== undefined) snakeCaseData.section_number = updateData.sectionNumber;
    if (updateData.title !== undefined) snakeCaseData.title = updateData.title;
    if (updateData.questionCount !== undefined) snakeCaseData.question_count = updateData.questionCount;

    const { data, error } = await supabase
      .from('sections')
      .update(snakeCaseData)
      .eq('id', sectionId)
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  delete: async (quizBookId: string, chapterId: string, sectionId: string) => {
    const { error } = await supabase.from('sections').delete().eq('id', sectionId);
    if (error) throw error;
    return { data: null };
  },
};

// Answer API
export const answerApi = {
  create: async (
    quizBookId: string,
    questionNumber: number,
    result: '○' | '×',
    chapterId?: string,
    sectionId?: string
  ) => {
    // まず既存の回答を探す
    let query = supabase
      .from('question_answers')
      .select('*')
      .eq('question_number', questionNumber);

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    } else if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    }

    const { data: existing } = await query.maybeSingle();

    // quiz_bookからcurrent_roundを取得
    const { data: quizBook } = await supabase
      .from('quiz_books')
      .select('current_round')
      .eq('id', quizBookId)
      .single();

    const currentRound = quizBook?.current_round || 1;

    const newAttempt: Attempt = {
      round: currentRound,
      result,
      resultConfirmFlg: false,
      answeredAt: new Date().toISOString(),
    };

    if (existing) {
      // 既存の回答を更新
      const attempts = [...(existing.attempts as Attempt[]), newAttempt];
      const { data, error } = await supabase
        .from('question_answers')
        .update({ attempts })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return { data: keysToCamel(data) };
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('question_answers')
        .insert({
          question_number: questionNumber,
          chapter_id: chapterId,
          section_id: sectionId,
          attempts: [newAttempt],
        })
        .select()
        .single();
      if (error) throw error;
      return { data: keysToCamel(data) };
    }
  },

  updateMemo: async (quizBookId: string, answerId: string, memo: string) => {
    const { data, error } = await supabase
      .from('question_answers')
      .update({ memo })
      .eq('id', answerId)
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  updateBookmark: async (quizBookId: string, answerId: string, isBookmarked: boolean) => {
    const { data, error } = await supabase
      .from('question_answers')
      .update({ is_bookmarked: isBookmarked })
      .eq('id', answerId)
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  delete: async (quizBookId: string, answerId: string) => {
    const { error } = await supabase.from('question_answers').delete().eq('id', answerId);
    if (error) throw error;
    return { data: null };
  },

  deleteLatest: async (quizBookId: string, answerId: string) => {
    // 最新の回答のみを削除
    const { data: existing } = await supabase
      .from('question_answers')
      .select('*')
      .eq('id', answerId)
      .single();

    if (existing && (existing.attempts as Attempt[]).length > 0) {
      const attempts = (existing.attempts as Attempt[]).slice(0, -1);
      if (attempts.length === 0) {
        // 全ての回答を削除
        const { error } = await supabase.from('question_answers').delete().eq('id', answerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_answers')
          .update({ attempts })
          .eq('id', answerId);
        if (error) throw error;
      }
    }
    return { data: null };
  },
};

// User API
export const userApi = {
  getMe: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  updateGoal: async (goal: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({ goal })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },
};

// Study Record API
export const studyRecordApi = {
  getRecent: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('study_records')
      .select(`
        *,
        quiz_book:quiz_books(title)
      `)
      .eq('user_id', user.id)
      .order('answered_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return { data: keysToCamel(data) };
  },

  create: async (record: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('study_records')
      .insert({
        quiz_book_id: record.quizBookId,
        chapter_id: record.chapterId,
        section_id: record.sectionId,
        question_number: record.questionNumber,
        result: record.result,
        round: record.round,
        answered_at: record.answeredAt,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    return { data: keysToCamel(data) };
  },
};

// 後方互換性のための空のエクスポート（axiosからの移行用）
export const setAuthToken = (token: string) => {
  // Supabaseは自動的にセッションを管理するため不要
};

export const authApi = {
  // authStoreで直接supabase.authを使用するため、ここは互換性のため空
  register: async () => { throw new Error('Use authStore.register instead'); },
  login: async () => { throw new Error('Use authStore.login instead'); },
};
