import { create } from 'zustand';
import { quizBookRepository } from '@/app/repositories/QuizBookRepository';
import { QuizBook, Chapter, Section, QuestionAnswer } from '@/types/QuizBook';

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
    const updatedQuizBooks = get().quizBooks.map(book => {
      const updatedChapters = book.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        const updateQuestionAnswer = (answers: QuestionAnswer[] = []) => {
          const existing = answers.find(qa => qa.questionNumber === questionNumber);
          if (existing) {
            return answers.map(qa =>
              qa.questionNumber === questionNumber
                ? {
                  ...qa,
                  attempts: [
                    ...qa.attempts,
                    {
                      round: qa.attempts.length + 1,
                      result,
                      resultConfirmFlg: true,
                      answeredAt: new Date()
                    }
                  ]
                }
                : qa
            );
          } else {
            return [
              ...answers,
              {
                questionNumber,
                attempts: [{
                  round: 1,
                  result,
                  resultConfirmFlg: true,
                  answeredAt: new Date()
                }]
              }
            ];
          }
        };

        if (sectionId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section =>
              section.id === sectionId
                ? { ...section, questionAnswers: updateQuestionAnswer(section.questionAnswers) }
                : section
            )
          };
        }

        return { ...chapter, questionAnswers: updateQuestionAnswer(chapter.questionAnswers) };
      });

      return { ...book, chapters: updatedChapters, updatedAt: new Date() };
    });

    set({ quizBooks: updatedQuizBooks });

    // Repository経由で保存
    const targetBook = updatedQuizBooks.find(book =>
      book.chapters.some(ch => ch.id === chapterId)
    );
    if (targetBook) {
      await quizBookRepository.update(targetBook.id, targetBook);
    }
  },

  toggleAnswerLock: async (chapterId, sectionId, questionNumber) => {
    const updatedQuizBooks = get().quizBooks.map(book => ({
      ...book,
      chapters: book.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        const toggleLock = (answers: QuestionAnswer[] = []) =>
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

        if (sectionId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section =>
              section.id === sectionId
                ? { ...section, questionAnswers: toggleLock(section.questionAnswers) }
                : section
            )
          };
        }

        return { ...chapter, questionAnswers: toggleLock(chapter.questionAnswers) };
      }),
      updatedAt: new Date()
    }));

    set({ quizBooks: updatedQuizBooks });

    const targetBook = updatedQuizBooks.find(book =>
      book.chapters.some(ch => ch.id === chapterId)
    );
    if (targetBook) {
      await quizBookRepository.update(targetBook.id, targetBook);
    }
  },

  saveMemo: async (chapterId, sectionId, questionNumber, memo) => {
    const updatedQuizBooks = get().quizBooks.map(book => ({
      ...book,
      chapters: book.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        const updateMemo = (answers: QuestionAnswer[] = []) =>
          answers.map(qa =>
            qa.questionNumber === questionNumber ? { ...qa, memo } : qa
          );

        if (sectionId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section =>
              section.id === sectionId
                ? { ...section, questionAnswers: updateMemo(section.questionAnswers) }
                : section
            )
          };
        }

        return { ...chapter, questionAnswers: updateMemo(chapter.questionAnswers) };
      }),
      updatedAt: new Date()
    }));

    set({ quizBooks: updatedQuizBooks });

    const targetBook = updatedQuizBooks.find(book =>
      book.chapters.some(ch => ch.id === chapterId)
    );
    if (targetBook) {
      await quizBookRepository.update(targetBook.id, targetBook);
    }
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
    const updatedQuizBooks = get().quizBooks.map(book => ({
      ...book,
      chapters: book.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        const updateResult = (answers: QuestionAnswer[] = []) =>
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

        if (sectionId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section =>
              section.id === sectionId
                ? { ...section, questionAnswers: updateResult(section.questionAnswers) }
                : section
            )
          };
        }

        return { ...chapter, questionAnswers: updateResult(chapter.questionAnswers) };
      }),
      updatedAt: new Date()
    }));

    set({ quizBooks: updatedQuizBooks });

    const targetBook = updatedQuizBooks.find(book =>
      book.chapters.some(ch => ch.id === chapterId)
    );
    if (targetBook) {
      await quizBookRepository.update(targetBook.id, targetBook);
    }
  },

  deleteLastAnswer: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const updatedQuizBooks = get().quizBooks.map(book => ({
      ...book,
      chapters: book.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        const deleteResult = (answers: QuestionAnswer[] = []) =>
          answers.map(qa => {
            if (qa.questionNumber !== questionNumber) return qa;
            const newAttempts = qa.attempts.slice(0, -1);
            return { ...qa, attempts: newAttempts };
          }).filter(qa => qa.attempts.length > 0);

        if (sectionId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section =>
              section.id === sectionId
                ? { ...section, questionAnswers: deleteResult(section.questionAnswers) }
                : section
            )
          };
        }

        return { ...chapter, questionAnswers: deleteResult(chapter.questionAnswers) };
      }),
      updatedAt: new Date()
    }));

    set({ quizBooks: updatedQuizBooks });

    const targetBook = updatedQuizBooks.find(book =>
      book.chapters.some(ch => ch.id === chapterId)
    );
    if (targetBook) {
      await quizBookRepository.update(targetBook.id, targetBook);
    }
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
}));