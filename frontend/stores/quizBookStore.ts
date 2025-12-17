import { create } from 'zustand';
import { QuizBook, Chapter, Section, QuestionAnswer, RecentStudyItem } from '@/types/QuizBook';
import { quizBookApi, chapterApi, sectionApi, answerApi } from '@/services/api';

interface QuizBookStore {
  quizBooks: QuizBook[];
  isLoading: boolean;

  // QuizBook操作
  fetchQuizBooks: () => Promise<void>;
  getQuizBookById: (id: string) => QuizBook | undefined;
  createQuizBook: (title: string, categoryId: string, useSections: boolean) => Promise<void>;
  addQuizBook: (title: string, categoryId: string, useSections: boolean) => Promise<void>; // createQuizBookのエイリアス
  updateQuizBook: (id: string, updates: any) => Promise<void>;
  deleteQuizBook: (id: string) => Promise<void>;

  // Chapter操作
  addChapter: (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) => Promise<void>;
  updateChapter: (quizBookId: string, chapterId: string, updates: any) => Promise<void>;
  deleteChapter: (quizBookId: string, chapterId: string) => Promise<void>;

  // Section操作
  addSection: (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) => Promise<void>;
  updateSection: (quizBookId: string, chapterId: string, sectionId: string, updates: any) => Promise<void>;
  deleteSection: (quizBookId: string, chapterId: string, sectionId: string) => Promise<void>;

  // Answer操作
  saveAnswer: (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) => Promise<void>;
  updateMemo: (quizBookId: string, answerId: string, memo: string) => Promise<void>;

  // 旧メソッド（後方互換性のため）
  saveMemo: (chapterId: string, sectionId: string | null, questionNumber: number, memo: string) => Promise<void>;
  getQuestionAnswers: (chapterId: string, sectionId: string | null, questionNumber: number) => QuestionAnswer | undefined;
  addQuestionToTarget: (chapterId: string, sectionId: string | null) => Promise<void>;
  deleteQuestionFromTarget: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;

  // 検索系
  getChapterById: (chapterId: string) => { book: QuizBook; chapter: Chapter } | undefined;
  getSectionById: (sectionId: string) => { book: QuizBook; chapter: Chapter; section: Section } | undefined;
  getRecentStudyItems: () => RecentStudyItem[];
}

export const useQuizBookStore = create<QuizBookStore>((set, get) => ({
  quizBooks: [],
  isLoading: false,

  // ========== QuizBook CRUD ==========
  
  fetchQuizBooks: async () => {
    set({ isLoading: true });
    try {
      const response = await quizBookApi.getAll();
      set({ quizBooks: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch quiz books:', error);
      set({ isLoading: false });
    }
  },

  getQuizBookById: (id: string) => {
    return get().quizBooks.find(book => book.id === id);
  },

  createQuizBook: async (title: string, categoryId: string, useSections: boolean) => {
    set({ isLoading: true });
    try {
      await quizBookApi.create(title, categoryId, useSections);
      await get().fetchQuizBooks(); // 再取得
    } catch (error) {
      console.error('Failed to create quiz book:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  addQuizBook: async (title: string, categoryId: string, useSections: boolean) => {
    // createQuizBookのエイリアス（後方互換性のため）
    return get().createQuizBook(title, categoryId, useSections);
  },

  updateQuizBook: async (id: string, updates: any) => {
    try {
      await quizBookApi.update(id, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update quiz book:', error);
      throw error;
    }
  },

  deleteQuizBook: async (id: string) => {
    try {
      await quizBookApi.delete(id);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete quiz book:', error);
      throw error;
    }
  },

  // ========== Chapter CRUD ==========

  addChapter: async (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) => {
    try {
      await chapterApi.create(quizBookId, chapterNumber, title, questionCount);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to add chapter:', error);
      throw error;
    }
  },

  updateChapter: async (quizBookId: string, chapterId: string, updates: any) => {
    try {
      await chapterApi.update(quizBookId, chapterId, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update chapter:', error);
      throw error;
    }
  },

  deleteChapter: async (quizBookId: string, chapterId: string) => {
    try {
      await chapterApi.delete(quizBookId, chapterId);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      throw error;
    }
  },

  // ========== Section CRUD ==========

  addSection: async (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) => {
    try {
      await sectionApi.create(quizBookId, chapterId, sectionNumber, title, questionCount);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to add section:', error);
      throw error;
    }
  },

  updateSection: async (quizBookId: string, chapterId: string, sectionId: string, updates: any) => {
    try {
      await sectionApi.update(quizBookId, chapterId, sectionId, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update section:', error);
      throw error;
    }
  },

  deleteSection: async (quizBookId: string, chapterId: string, sectionId: string) => {
    try {
      await sectionApi.delete(quizBookId, chapterId, sectionId);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete section:', error);
      throw error;
    }
  },

  // ========== Answer操作 ==========

  saveAnswer: async (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) => {
    try {
      await answerApi.create(quizBookId, questionNumber, result, chapterId, sectionId);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to save answer:', error);
      throw error;
    }
  },

  updateMemo: async (quizBookId: string, answerId: string, memo: string) => {
    try {
      await answerApi.update(quizBookId, answerId, memo);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update memo:', error);
      throw error;
    }
  },

  // ========== 検索系 ==========

  getChapterById: (chapterId: string) => {
    for (const book of get().quizBooks) {
      const chapter = book.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        return { book, chapter };
      }
    }
    return undefined;
  },

  getSectionById: (sectionId: string) => {
    for (const book of get().quizBooks) {
      for (const chapter of book.chapters) {
        const section = chapter.sections?.find(sec => sec.id === sectionId);
        if (section) {
          return { book, chapter, section };
        }
      }
    }
    return undefined;
  },

  getRecentStudyItems: () => {
    const { quizBooks } = get();
    const recentItems: RecentStudyItem[] = [];

    quizBooks.forEach(book => {
      book.chapters.forEach(chapter => {
        if (book.useSections && chapter.sections) {
          chapter.sections.forEach(section => {
            const lastAnswer = getLastConfirmedAnswer(section.questionAnswers);
            if (lastAnswer) {
              recentItems.push({
                type: 'section',
                bookId: book.id,
                bookTitle: book.title,
                category: book.category?.name || '',
                chapterId: chapter.id,
                chapterNumber: chapter.chapterNumber,
                chapterTitle: chapter.title || '',
                sectionId: section.id,
                sectionNumber: section.sectionNumber,
                sectionTitle: section.title || '',
                lastAnsweredAt: lastAnswer.answeredAt,
                lastQuestionNumber: lastAnswer.questionNumber,
                lastResult: lastAnswer.result,
              });
            }
          });
        } else {
          const lastAnswer = getLastConfirmedAnswer(chapter.questionAnswers);
          if (lastAnswer) {
            recentItems.push({
              type: 'chapter',
              bookId: book.id,
              bookTitle: book.title,
              category: book.category?.name || '',
              chapterId: chapter.id,
              chapterNumber: chapter.chapterNumber,
              chapterTitle: chapter.title || '',
              lastAnsweredAt: new Date(lastAnswer.answeredAt),
              lastQuestionNumber: lastAnswer.questionNumber,
              lastResult: lastAnswer.result,
            });
          }
        }
      });
    });

    return recentItems
      .sort((a, b) => new Date(b.lastAnsweredAt).getTime() - new Date(a.lastAnsweredAt).getTime())
      .slice(0, 3);
  },

  // ========== 旧メソッド（後方互換性） ==========

  saveMemo: async (chapterId: string, sectionId: string | null, questionNumber: number, memo: string) => {
    const { quizBooks } = get();

    // 対象の問題を探す
    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          const questionAnswers = sectionId
            ? chapter.sections?.find(s => s.id === sectionId)?.questionAnswers
            : chapter.questionAnswers;

          const qa = questionAnswers?.find(q => q.questionNumber === questionNumber);
          if (qa && qa.id) {
            await get().updateMemo(book.id, qa.id, memo);
            return;
          }
        }
      }
    }
  },

  getQuestionAnswers: (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();

    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          const questionAnswers = sectionId
            ? chapter.sections?.find(s => s.id === sectionId)?.questionAnswers
            : chapter.questionAnswers;

          return questionAnswers?.find(q => q.questionNumber === questionNumber);
        }
      }
    }
    return undefined;
  },

  addQuestionToTarget: async (chapterId: string, sectionId: string | null) => {
    const { quizBooks } = get();

    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          if (sectionId) {
            const section = chapter.sections?.find(s => s.id === sectionId);
            if (section) {
              await get().updateSection(book.id, chapterId, sectionId, {
                questionCount: (section.questionCount || 0) + 1
              });
            }
          } else {
            await get().updateChapter(book.id, chapterId, {
              questionCount: (chapter.questionCount || 0) + 1
            });
          }
          return;
        }
      }
    }
  },

  deleteQuestionFromTarget: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();

    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          // 回答データを削除
          const questionAnswers = sectionId
            ? chapter.sections?.find(s => s.id === sectionId)?.questionAnswers
            : chapter.questionAnswers;

          const qa = questionAnswers?.find(q => q.questionNumber === questionNumber);
          if (qa && qa.id) {
            await answerApi.delete(book.id, qa.id);
          }

          // questionCountを減らす
          if (sectionId) {
            const section = chapter.sections?.find(s => s.id === sectionId);
            if (section && section.questionCount && section.questionCount > 0) {
              await get().updateSection(book.id, chapterId, sectionId, {
                questionCount: section.questionCount - 1
              });
            }
          } else {
            if (chapter.questionCount && chapter.questionCount > 0) {
              await get().updateChapter(book.id, chapterId, {
                questionCount: chapter.questionCount - 1
              });
            }
          }
          return;
        }
      }
    }
  },
}));

// ========== ヘルパー関数 ==========
function getLastConfirmedAnswer(
  questionAnswers?: QuestionAnswer[]
): { questionNumber: number; result: '○' | '×'; answeredAt: string } | null {
  if (!questionAnswers || questionAnswers.length === 0) return null;

  let lastAnswer: { questionNumber: number; result: '○' | '×'; answeredAt: string } | null = null;

  questionAnswers.forEach(qa => {
    const confirmedAttempts = qa.attempts.filter(a => a.resultConfirmFlg);
    if (confirmedAttempts.length > 0) {
      const latest = confirmedAttempts[confirmedAttempts.length - 1];
      if (!lastAnswer || new Date(latest.answeredAt).getTime() > new Date(lastAnswer.answeredAt).getTime()) {
        lastAnswer = {
          questionNumber: qa.questionNumber,
          result: latest.result,
          answeredAt: latest.answeredAt,
        };
      }
    }
  });

  return lastAnswer;
}