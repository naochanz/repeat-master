import { create } from 'zustand';
import { quizBookRepository } from '@/repositories/QuizBookRepository';
import { QuizBook, Chapter, Section, QuestionAnswer, RecentStudyItem } from '@/types/QuizBook';

// ========== ヘルパー型・関数（共通パターンの抽出）==========

/**
 * QuestionAnswer配列を変換する関数の型
 */
type AnswerTransformer = (answers: QuestionAnswer[]) => QuestionAnswer[];

/**
 * クイズブック内の特定チャプター/セクションのquestionAnswersを更新する
 * 共通パターン: books → chapters → sections の多段マッピングを一元化
 */
function updateQuestionAnswersInBooks(
  quizBooks: QuizBook[],
  chapterId: string,
  sectionId: string | null,
  transformer: AnswerTransformer
): QuizBook[] {
  return quizBooks.map(book => ({
    ...book,
    chapters: book.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;

      if (sectionId && chapter.sections) {
        return {
          ...chapter,
          sections: chapter.sections.map(section =>
            section.id === sectionId
              ? { ...section, questionAnswers: transformer(section.questionAnswers || []) }
              : section
          )
        };
      }

      return { ...chapter, questionAnswers: transformer(chapter.questionAnswers || []) };
    }),
    updatedAt: new Date()
  }));
}

/**
 * 特定のchapterIdを含むBookを見つけてリポジトリに保存する
 */
async function saveBookContainingChapter(
  quizBooks: QuizBook[],
  chapterId: string
): Promise<void> {
  const targetBook = quizBooks.find(book =>
    book.chapters.some(ch => ch.id === chapterId)
  );
  if (targetBook) {
    await quizBookRepository.update(targetBook.id, targetBook);
  }
}

interface QuizBookStore {
  // 状態
  currentQuizBook: Partial<QuizBook> | null;
  quizBooks: QuizBook[];
  isLoading: boolean;
  isLoaded: boolean;

  // アクション
  setCurrentQuizBook: (quizBook: Partial<QuizBook>) => void;
  updateCurrentQuizBook: (updates: Partial<QuizBook>) => void;
  addQuizBook: (quizBook: QuizBook) => Promise<void>;
  clearCurrentQuizBook: () => void;
  addChapter: (chapter: Chapter) => void;
  updateChapter: (chapterIndex: number, updates: Partial<Chapter>) => void;
  addSection: (chapterIndex: number, section: Section) => void;
  updateSection: (chapterIndex: number, sectionIndex: number, updates: Partial<Section>) => void;
  setQuestionCount: (chapterIndex: number, sectionIndex: number, count: number) => void;
  fetchQuizBooks: () => Promise<void>;
  getQuizBookById: (id: string) => QuizBook | undefined;
  getChapterById: (chapterId: string) => { book: QuizBook; chapter: Chapter } | undefined;
  getSectionById: (sectionId: string) => { book: QuizBook; chapter: Chapter; section: Section; } | undefined;
  saveAnswer: (chapterId: string, sectionId: string | null, questionNumber: number, result: '○' | '×') => Promise<void>;
  toggleAnswerLock: (chapterId: string, sectionId: string | null, questionNumber: number) => void;
  saveMemo: (chapterId: string, sectionId: string | null, questionNumber: number, memo: string) => Promise<void>;
  getQuestionAnswers: (chapterId: string, sectionId: string | null, questionNumber: number) => QuestionAnswer | undefined;
  updateLastAnswer: (chapterId: string, sectionId: string | null, questionNumber: number, result: '○' | '×') => Promise<void>;
  deleteLastAnswer: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;
  deleteQuizBook: (id: string) => Promise<void>;
  updateQuizBook: (id: string, updates: Partial<QuizBook>) => Promise<void>;

  // 新規追加のアクション
  addChapterToQuizBook: (quizBookId: string, chapterTitle: string) => Promise<void>;
  deleteChapterFromQuizBook: (quizBookId: string, chapterId: string) => Promise<void>;
  updateChapterInQuizBook: (quizBookId: string, chapterId: string, updates: Partial<Chapter>) => Promise<void>;
  addSectionToChapter: (quizBookId: string, chapterId: string, sectionTitle: string) => Promise<void>;
  deleteSectionFromChapter: (quizBookId: string, chapterId: string, sectionId: string) => Promise<void>;
  updateSectionInChapter: (quizBookId: string, chapterId: string, sectionId: string, updates: Partial<Section>) => Promise<void>;
  addQuestionToTarget: (chapterId: string, sectionId: string | null) => Promise<void>;
  deleteQuestionFromTarget: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;
  getRecentStudyItems: () => RecentStudyItem[];
}

export const useQuizBookStore = create<QuizBookStore>((set, get) => ({
  // ========== 初期状態 ==========
  currentQuizBook: null,
  quizBooks: [],
  isLoading: false,
  isLoaded: false,

  // ========== 基本アクション ==========
  setCurrentQuizBook: (quizBook) => set({ currentQuizBook: quizBook }),

  updateCurrentQuizBook: (updates) => set((state) => ({
    currentQuizBook: state.currentQuizBook
      ? { ...state.currentQuizBook, ...updates }
      : updates
  })),

  clearCurrentQuizBook: () => set({ currentQuizBook: null }),

  // ========== データ読み込み ==========
  fetchQuizBooks: async () => {
    set({ isLoading: true });
    try {
      const quizBooks = await quizBookRepository.getAll();
      set({ quizBooks, isLoading: false, isLoaded: true });
    } catch (error) {
      console.error('Failed to fetch quiz books:', error);
      set({ isLoading: false, isLoaded: true });
    }
  },

  // ========== CRUD操作（Repository経由）==========
  addQuizBook: async (quizBook) => {
    set({ isLoading: true });
    try {
      await quizBookRepository.create(quizBook);

      // ✅ 保存後、全データを再取得
      const allBooks = await quizBookRepository.getAll();
      set({
        quizBooks: allBooks,
        currentQuizBook: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to add quiz book:', error);
      set({ isLoading: false });
    }
  },

  deleteQuizBook: async (id: string) => {
    set({ isLoading: true });
    try {
      await quizBookRepository.delete(id);

      // ✅ 削除後、全データを再取得
      const allBooks = await quizBookRepository.getAll();
      set({
        quizBooks: allBooks,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to delete quiz book:', error);
      set({ isLoading: false });
    }
  },

  updateQuizBook: async (id: string, updates: Partial<QuizBook>) => {
    set({ isLoading: true });
    try {
      await quizBookRepository.update(id, { ...updates, updatedAt: new Date() });

      // ✅ 更新後、全データを再取得
      const allBooks = await quizBookRepository.getAll();
      set({
        quizBooks: allBooks,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to update quiz book:', error);
      set({ isLoading: false });
    }
  },

  // ========== 検索系メソッド ==========
  getQuizBookById: (id) => {
    return get().quizBooks.find(book => book.id === id);
  },

  getChapterById: (chapterId) => {
    for (const book of get().quizBooks) {
      const chapter = book.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        return { book, chapter };
      }
    }
    return undefined;
  },

  getSectionById: (sectionId) => {
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

  // ========== currentQuizBook用の操作 ==========
  addChapter: (chapter) => set((state) => ({
    currentQuizBook: state.currentQuizBook
      ? {
        ...state.currentQuizBook,
        chapters: [...(state.currentQuizBook.chapters || []), chapter]
      }
      : { chapters: [chapter] }
  })),

  updateChapter: (chapterIndex, updates) => set((state) => {
    const chapters = [...(state.currentQuizBook?.chapters || [])];
    chapters[chapterIndex] = { ...chapters[chapterIndex], ...updates };
    return {
      currentQuizBook: { ...state.currentQuizBook, chapters }
    };
  }),

  addSection: (chapterIndex, section) => set((state) => {
    const chapters = [...(state.currentQuizBook?.chapters || [])];
    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      sections: [...(chapters[chapterIndex].sections || []), section]
    };
    return {
      currentQuizBook: { ...state.currentQuizBook, chapters }
    };
  }),

  updateSection: (chapterIndex, sectionIndex, updates) => set((state) => {
    const chapters = [...(state.currentQuizBook?.chapters || [])];
    chapters[chapterIndex].sections![sectionIndex] = {
      ...chapters[chapterIndex].sections![sectionIndex],
      ...updates
    };
    return {
      currentQuizBook: { ...state.currentQuizBook, chapters }
    };
  }),

  setQuestionCount: (chapterIndex, sectionIndex, count) => set((state) => {
    const chapters = [...(state.currentQuizBook?.chapters || [])];
    if (sectionIndex >= 0) {
      chapters[chapterIndex].sections![sectionIndex].questionCount = count;
    } else {
      chapters[chapterIndex].questionCount = count;
    }
    return {
      currentQuizBook: { ...state.currentQuizBook, chapters }
    };
  }),

  // ========== 問題集操作（Repository経由で保存）==========

  saveAnswer: async (chapterId, sectionId, questionNumber, result) => {
    const addAttemptTransformer: AnswerTransformer = (answers) => {
      const existing = answers.find(qa => qa.questionNumber === questionNumber);
      if (existing) {
        return answers.map(qa =>
          qa.questionNumber === questionNumber
            ? {
                ...qa,
                attempts: [
                  ...qa.attempts,
                  { round: qa.attempts.length + 1, result, resultConfirmFlg: true, answeredAt: new Date() }
                ]
              }
            : qa
        );
      }
      return [
        ...answers,
        { questionNumber, attempts: [{ round: 1, result, resultConfirmFlg: true, answeredAt: new Date() }] }
      ];
    };

    const updatedQuizBooks = updateQuestionAnswersInBooks(
      get().quizBooks, chapterId, sectionId, addAttemptTransformer
    );
    set({ quizBooks: updatedQuizBooks });
    await saveBookContainingChapter(updatedQuizBooks, chapterId);
  },

  toggleAnswerLock: async (chapterId, sectionId, questionNumber) => {
    const toggleLockTransformer: AnswerTransformer = (answers) =>
      answers.map(qa =>
        qa.questionNumber === questionNumber
          ? {
              ...qa,
              attempts: qa.attempts.map((att, idx) =>
                idx === qa.attempts.length - 1
                  ? { ...att, resultConfirmFlg: !att.resultConfirmFlg }
                  : att
              )
            }
          : qa
      );

    const updatedQuizBooks = updateQuestionAnswersInBooks(
      get().quizBooks, chapterId, sectionId, toggleLockTransformer
    );
    set({ quizBooks: updatedQuizBooks });
    await saveBookContainingChapter(updatedQuizBooks, chapterId);
  },

  saveMemo: async (chapterId, sectionId, questionNumber, memo) => {
    const updateMemoTransformer: AnswerTransformer = (answers) =>
      answers.map(qa =>
        qa.questionNumber === questionNumber ? { ...qa, memo } : qa
      );

    const updatedQuizBooks = updateQuestionAnswersInBooks(
      get().quizBooks, chapterId, sectionId, updateMemoTransformer
    );
    set({ quizBooks: updatedQuizBooks });
    await saveBookContainingChapter(updatedQuizBooks, chapterId);
  },

  getQuestionAnswers: (chapterId, sectionId, questionNumber) => {
    const data = sectionId
      ? get().getSectionById(sectionId)
      : get().getChapterById(chapterId);

    if (!data) return undefined;

    const answers = sectionId
      ? (data as any).section.questionAnswers
      : (data as any).chapter.questionAnswers;

    return answers?.find((qa: QuestionAnswer) => qa.questionNumber === questionNumber);
  },

  updateLastAnswer: async (chapterId: string, sectionId: string | null, questionNumber: number, result: '○' | '×') => {
    const updateResultTransformer: AnswerTransformer = (answers) =>
      answers.map(qa =>
        qa.questionNumber === questionNumber
          ? {
              ...qa,
              attempts: qa.attempts.map((att, idx) =>
                idx === qa.attempts.length - 1 ? { ...att, result } : att
              )
            }
          : qa
      );

    const updatedQuizBooks = updateQuestionAnswersInBooks(
      get().quizBooks, chapterId, sectionId, updateResultTransformer
    );
    set({ quizBooks: updatedQuizBooks });
    await saveBookContainingChapter(updatedQuizBooks, chapterId);
  },

  deleteLastAnswer: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const deleteLastAttemptTransformer: AnswerTransformer = (answers) =>
      answers
        .map(qa => {
          if (qa.questionNumber !== questionNumber) return qa;
          return { ...qa, attempts: qa.attempts.slice(0, -1) };
        })
        .filter(qa => qa.attempts.length > 0);

    const updatedQuizBooks = updateQuestionAnswersInBooks(
      get().quizBooks, chapterId, sectionId, deleteLastAttemptTransformer
    );
    set({ quizBooks: updatedQuizBooks });
    await saveBookContainingChapter(updatedQuizBooks, chapterId);
  },

  // ========== 章の追加・削除・更新（修正版）==========

  addChapterToQuizBook: async (quizBookId: string, chapterTitle: string) => {
    const book = get().quizBooks.find(b => b.id === quizBookId);
    if (!book) return;

    const newChapterNumber = book.chapters.length + 1;
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: chapterTitle || ``,
      chapterNumber: newChapterNumber,
      chapterRate: 0,
      questionCount: 0,
      questionAnswers: []
    };

    const updatedBook = {
      ...book,
      chapters: [...book.chapters, newChapter],
      chapterCount: book.chapterCount + 1,
      updatedAt: new Date()
    };

    await quizBookRepository.update(quizBookId, updatedBook);

    // ✅ 保存後、全データを再取得して確実に反映
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  deleteChapterFromQuizBook: async (quizBookId: string, chapterId: string) => {
    const book = get().quizBooks.find(b => b.id === quizBookId);
    if (!book) return;

    const filteredChapters = book.chapters.filter(ch => ch.id !== chapterId);
    const reorderedChapters = filteredChapters.map((ch, index) => ({
      ...ch,
      chapterNumber: index + 1
    }));

    const updatedBook = {
      ...book,
      chapters: reorderedChapters,
      chapterCount: reorderedChapters.length,
      updatedAt: new Date()
    };

    await quizBookRepository.update(quizBookId, updatedBook);

    // ✅ 保存後、全データを再取得
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  updateChapterInQuizBook: async (quizBookId: string, chapterId: string, updates: Partial<Chapter>) => {
    const book = get().quizBooks.find(b => b.id === quizBookId);
    if (!book) return;

    const updatedBook = {
      ...book,
      chapters: book.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, ...updates } : ch
      ),
      updatedAt: new Date()
    };

    await quizBookRepository.update(quizBookId, updatedBook);

    // ✅ 保存後、全データを再取得
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  // ========== 節の追加・削除・更新（修正版）==========

  addSectionToChapter: async (quizBookId: string, chapterId: string, sectionTitle: string) => {
    const book = get().quizBooks.find(b => b.id === quizBookId);
    if (!book) return;

    const updatedBook = {
      ...book,
      chapters: book.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;

        const sections = ch.sections || [];
        const newSectionNumber = sections.length + 1;
        const newSection: Section = {
          id: `section-${Date.now()}`,
          title: sectionTitle,
          sectionNumber: newSectionNumber,
          questionCount: 0,
          questionAnswers: []
        };

        return {
          ...ch,
          sections: [...sections, newSection]
        };
      }),
      updatedAt: new Date()
    };

    await quizBookRepository.update(quizBookId, updatedBook);

    // ✅ 保存後、全データを再取得
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  deleteSectionFromChapter: async (quizBookId: string, chapterId: string, sectionId: string) => {
    const book = get().quizBooks.find(b => b.id === quizBookId);
    if (!book) return;

    const updatedBook = {
      ...book,
      chapters: book.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;

        const filteredSections = (ch.sections || []).filter(sec => sec.id !== sectionId);
        const reorderedSections = filteredSections.map((sec, index) => ({
          ...sec,
          sectionNumber: index + 1
        }));

        return {
          ...ch,
          sections: reorderedSections
        };
      }),
      updatedAt: new Date()
    };

    await quizBookRepository.update(quizBookId, updatedBook);

    // ✅ 保存後、全データを再取得
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  updateSectionInChapter: async (quizBookId: string, chapterId: string, sectionId: string, updates: Partial<Section>) => {
    const book = get().quizBooks.find(b => b.id === quizBookId);
    if (!book) return;

    const updatedBook = {
      ...book,
      chapters: book.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;

        return {
          ...ch,
          sections: (ch.sections || []).map(sec =>
            sec.id === sectionId ? { ...sec, ...updates } : sec
          )
        };
      }),
      updatedAt: new Date()
    };

    await quizBookRepository.update(quizBookId, updatedBook);

    // ✅ 保存後、全データを再取得
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  // ========== 問題の追加・削除（修正版）==========

  addQuestionToTarget: async (chapterId: string, sectionId: string | null) => {
    const targetBook = get().quizBooks.find(book =>
      book.chapters.some(ch => ch.id === chapterId)
    );
    if (!targetBook) return;

    const updatedBook = {
      ...targetBook,
      chapters: targetBook.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        if (sectionId) {
          return {
            ...chapter,
            sections: (chapter.sections || []).map(section => {
              if (section.id !== sectionId) return section;
              return {
                ...section,
                questionCount: section.questionCount + 1
              };
            })
          };
        } else {
          return {
            ...chapter,
            questionCount: (chapter.questionCount || 0) + 1
          };
        }
      }),
      updatedAt: new Date()
    };

    await quizBookRepository.update(targetBook.id, updatedBook);

    // ✅ 保存後、全データを再取得
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  deleteQuestionFromTarget: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const targetBook = get().quizBooks.find(book =>
      book.chapters.some(ch => ch.id === chapterId)
    );
    if (!targetBook) return;

    const updatedBook = {
      ...targetBook,
      chapters: targetBook.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        if (sectionId) {
          return {
            ...chapter,
            sections: (chapter.sections || []).map(section => {
              if (section.id !== sectionId) return section;

              const updatedAnswers = (section.questionAnswers || [])
                .filter(qa => qa.questionNumber !== questionNumber)
                .map((qa, index) => ({
                  ...qa,
                  questionNumber: index + 1
                }));

              return {
                ...section,
                questionCount: Math.max(0, section.questionCount - 1),
                questionAnswers: updatedAnswers
              };
            })
          };
        } else {
          const updatedAnswers = (chapter.questionAnswers || [])
            .filter(qa => qa.questionNumber !== questionNumber)
            .map((qa, index) => ({
              ...qa,
              questionNumber: index + 1
            }));

          return {
            ...chapter,
            questionCount: Math.max(0, (chapter.questionCount || 0) - 1),
            questionAnswers: updatedAnswers
          };
        }
      }),
      updatedAt: new Date()
    };

    await quizBookRepository.update(targetBook.id, updatedBook);

    // ✅ 保存後、全データを再取得
    const allBooks = await quizBookRepository.getAll();
    set({ quizBooks: allBooks });
  },

  getRecentStudyItems: () => {
    const { quizBooks } = get();
    const recentItems: RecentStudyItem[] = [];

    quizBooks.forEach(book => {
      book.chapters.forEach(chapter => {
        if (book.useSections && chapter.sections) {
          // 節がある場合
          chapter.sections.forEach(section => {
            const lastAnswer = getLastConfirmedAnswer(section.questionAnswers);
            if (lastAnswer) {
              recentItems.push({
                type: 'section',
                bookId: book.id,
                bookTitle: book.title,
                category: book.category,
                chapterId: chapter.id,
                chapterNumber: chapter.chapterNumber,
                chapterTitle: chapter.title,
                sectionId: section.id,
                sectionNumber: section.sectionNumber,
                sectionTitle: section.title,
                lastAnsweredAt: lastAnswer.answeredAt,
                lastQuestionNumber: lastAnswer.questionNumber,
                lastResult: lastAnswer.result,
              });
            }
          });
        } else {
          // 節がない場合
          const lastAnswer = getLastConfirmedAnswer(chapter.questionAnswers);
          if (lastAnswer) {
            recentItems.push({ 
              type: 'chapter',
              bookId: book.id,
              bookTitle: book.title,
              category: book.category,
              chapterId: chapter.id,
              chapterNumber: chapter.chapterNumber,
              chapterTitle: chapter.title,
              lastAnsweredAt: lastAnswer.answeredAt,
              lastQuestionNumber: lastAnswer.questionNumber,
              lastResult: lastAnswer.result,
            });
          }
        }
      });
    });
    return recentItems
      .sort((a, b) => b.lastAnsweredAt.getTime() - a.lastAnsweredAt.getTime())
      .slice(0, 3);
  },
}));

// ========== ヘルパー関数 ==========
function getLastConfirmedAnswer(
  questionAnswers?: QuestionAnswer[]
): { questionNumber: number; result: '○' | '×'; answeredAt: Date } | null {
  if (!questionAnswers || questionAnswers.length === 0) return null;

  let lastAnswer: { questionNumber: number; result: '○' | '×'; answeredAt: Date } | null = null;

  questionAnswers.forEach(qa => {
    const confirmedAttempts = qa.attempts.filter(a => a.resultConfirmFlg);
    if (confirmedAttempts.length > 0) {
      const latest = confirmedAttempts[confirmedAttempts.length - 1];
      if (!lastAnswer || latest.answeredAt.getTime() > lastAnswer.answeredAt.getTime()) {
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