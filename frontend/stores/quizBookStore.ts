import { create } from 'zustand';
import { QuizBook, Chapter, Section, QuestionAnswer, RecentStudyItem, Category } from '@/types/QuizBook';
import { quizBookApi, chapterApi, sectionApi, answerApi, categoryApi } from '@/services/api';
import { showErrorToast } from '@/utils/toast';

interface QuizBookStore {
  quizBooks: QuizBook[];
  categories: Category[];
  isLoading: boolean;

  // Category操作
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<string>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // QuizBook操作
  fetchQuizBooks: () => Promise<void>;
  getQuizBookById: (id: string) => QuizBook | undefined;
  createQuizBook: (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => Promise<void>;
  addQuizBook: (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => Promise<void>; // createQuizBookのエイリアス
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
  toggleBookmark: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;
  isBookmarked: (chapterId: string, sectionId: string | null, questionNumber: number) => boolean;

  // 旧メソッド（後方互換性のため）
  saveMemo: (chapterId: string, sectionId: string | null, questionNumber: number, memo: string) => Promise<void>;
  getQuestionAnswers: (chapterId: string, sectionId: string | null, questionNumber: number) => QuestionAnswer | undefined;
  addQuestionToTarget: (chapterId: string, sectionId: string | null) => Promise<void>;
  deleteQuestionFromTarget: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;
  deleteLatestAttempt: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;

  // 検索系
  getChapterById: (chapterId: string) => { book: QuizBook; chapter: Chapter } | undefined;
  getSectionById: (sectionId: string) => { book: QuizBook; chapter: Chapter; section: Section } | undefined;
  getRecentStudyItems: () => RecentStudyItem[];
}

export const useQuizBookStore = create<QuizBookStore>((set, get) => ({
  quizBooks: [],
  categories: [],
  isLoading: false,

  // ========== Category CRUD ==========

  fetchCategories: async () => {
    try {
      const response = await categoryApi.getAll();
      set({ categories: response.data });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showErrorToast('カテゴリの取得に失敗しました。');
    }
  },

  createCategory: async (name: string) => {
    try {
      const response = await categoryApi.create(name);
      await get().fetchCategories();
      return response.data.id;
    } catch (error) {
      console.error('Failed to create category:', error);
      showErrorToast('カテゴリの作成に失敗しました。');
      throw error;
    }
  },

  updateCategory: async (id: string, name: string) => {
    try {
      await categoryApi.update(id, { name });
      await get().fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      showErrorToast('カテゴリの更新に失敗しました。');
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    try {
      // カテゴリに属する全ての問題集を削除
      const categoryBooks = get().quizBooks.filter(book => book.categoryId === id);
      for (const book of categoryBooks) {
        await get().deleteQuizBook(book.id);
      }

      // カテゴリを削除
      await categoryApi.delete(id);
      await get().fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      showErrorToast('カテゴリの削除に失敗しました。');
      throw error;
    }
  },

  // ========== QuizBook CRUD (Optimistic UI) ==========

  fetchQuizBooks: async () => {
    set({ isLoading: true });
    try {
      const response = await quizBookApi.getAll();
      set({ quizBooks: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch quiz books:', error);
      showErrorToast('問題集の取得に失敗しました。');
      set({ isLoading: false });
    }
  },

  getQuizBookById: (id: string) => {
    return get().quizBooks.find(book => book.id === id);
  },

  createQuizBook: async (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => {
    const { quizBooks, categories } = get();
    const tempId = `temp-${Date.now()}`;
    const category = categories.find(c => c.id === categoryId);

    // Optimistic UI: 即座にローカル状態を更新
    const newQuizBook: QuizBook = {
      id: tempId,
      title,
      isbn: isbn || null,
      thumbnailUrl: thumbnailUrl || null,
      categoryId,
      category: category || { id: categoryId, name: '', createdAt: '', updatedAt: '' },
      useSections,
      chapterCount: 0,
      currentRate: 0,
      currentRound: 1,
      chapters: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({ quizBooks: [newQuizBook, ...quizBooks], isLoading: false });

    // バックグラウンドでAPI呼び出し
    quizBookApi.create(title, categoryId, useSections, isbn, thumbnailUrl)
      .then(() => get().fetchQuizBooks())
      .catch(async (error) => {
        console.error('Failed to create quiz book:', error);
        showErrorToast('問題集の作成に失敗しました。再度お試しください。');
        await get().fetchQuizBooks();
      });
  },

  addQuizBook: async (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => {
    // createQuizBookのエイリアス（後方互換性のため）
    return get().createQuizBook(title, categoryId, useSections, isbn, thumbnailUrl);
  },

  updateQuizBook: async (id: string, updates: any) => {
    const { quizBooks } = get();
    const previousQuizBooks = [...quizBooks];

    // Optimistic UI: 即座にローカル状態を更新
    set({
      quizBooks: quizBooks.map(book =>
        book.id === id ? { ...book, ...updates } : book
      )
    });

    try {
      await quizBookApi.update(id, updates);
      // 成功時は最新データを取得（他のフィールドも更新されている可能性があるため）
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update quiz book:', error);
      // 失敗時はロールバック
      set({ quizBooks: previousQuizBooks });
      showErrorToast('問題集の更新に失敗しました。');
      throw error;
    }
  },

  deleteQuizBook: async (id: string) => {
    try {
      await quizBookApi.delete(id);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete quiz book:', error);
      showErrorToast('問題集の削除に失敗しました。');
      throw error;
    }
  },

  // ========== Chapter CRUD (Optimistic UI) ==========

  addChapter: async (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) => {
    const { quizBooks } = get();
    const tempId = `temp-chapter-${Date.now()}`;

    // Optimistic UI: 即座にローカル状態を更新
    const newChapter: Chapter = {
      id: tempId,
      title: title || '',
      chapterNumber,
      chapterRate: 0,
      questionCount: questionCount || 0,
      questionAnswers: [],
      sections: [],
    };

    const updatedQuizBooks = quizBooks.map(book => {
      if (book.id !== quizBookId) return book;
      return {
        ...book,
        chapters: [...book.chapters, newChapter].sort((a, b) => a.chapterNumber - b.chapterNumber),
        chapterCount: book.chapterCount + 1,
      };
    });

    set({ quizBooks: updatedQuizBooks });

    // バックグラウンドでAPI呼び出し
    chapterApi.create(quizBookId, chapterNumber, title, questionCount)
      .then(() => get().fetchQuizBooks())
      .catch(async (error) => {
        console.error('Failed to add chapter:', error);
        showErrorToast('章の追加に失敗しました。再度お試しください。');
        await get().fetchQuizBooks();
      });
  },

  updateChapter: async (quizBookId: string, chapterId: string, updates: any) => {
    const { quizBooks } = get();
    const previousQuizBooks = [...quizBooks];

    // Optimistic UI: 即座にローカル状態を更新
    set({
      quizBooks: quizBooks.map(book => {
        if (book.id !== quizBookId) return book;
        return {
          ...book,
          chapters: book.chapters.map(chapter =>
            chapter.id === chapterId ? { ...chapter, ...updates } : chapter
          )
        };
      })
    });

    try {
      await chapterApi.update(quizBookId, chapterId, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update chapter:', error);
      set({ quizBooks: previousQuizBooks });
      showErrorToast('章の更新に失敗しました。');
      throw error;
    }
  },

  deleteChapter: async (quizBookId: string, chapterId: string) => {
    try {
      await chapterApi.delete(quizBookId, chapterId);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      showErrorToast('章の削除に失敗しました。');
      throw error;
    }
  },

  // ========== Section CRUD (Optimistic UI) ==========

  addSection: async (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) => {
    const { quizBooks } = get();
    const tempId = `temp-section-${Date.now()}`;

    // Optimistic UI: 即座にローカル状態を更新
    const newSection: Section = {
      id: tempId,
      title: title || '',
      sectionNumber,
      questionCount: questionCount || 0,
      questionAnswers: [],
    };

    const updatedQuizBooks = quizBooks.map(book => {
      if (book.id !== quizBookId) return book;
      return {
        ...book,
        chapters: book.chapters.map(chapter => {
          if (chapter.id !== chapterId) return chapter;
          return {
            ...chapter,
            sections: [...(chapter.sections || []), newSection].sort((a, b) => a.sectionNumber - b.sectionNumber),
          };
        }),
      };
    });

    set({ quizBooks: updatedQuizBooks });

    // バックグラウンドでAPI呼び出し
    sectionApi.create(quizBookId, chapterId, sectionNumber, title, questionCount)
      .then(() => get().fetchQuizBooks())
      .catch(async (error) => {
        console.error('Failed to add section:', error);
        showErrorToast('節の追加に失敗しました。再度お試しください。');
        await get().fetchQuizBooks();
      });
  },

  updateSection: async (quizBookId: string, chapterId: string, sectionId: string, updates: any) => {
    const { quizBooks } = get();
    const previousQuizBooks = [...quizBooks];

    // Optimistic UI: 即座にローカル状態を更新
    set({
      quizBooks: quizBooks.map(book => {
        if (book.id !== quizBookId) return book;
        return {
          ...book,
          chapters: book.chapters.map(chapter => {
            if (chapter.id !== chapterId) return chapter;
            return {
              ...chapter,
              sections: (chapter.sections || []).map(section =>
                section.id === sectionId ? { ...section, ...updates } : section
              )
            };
          })
        };
      })
    });

    try {
      await sectionApi.update(quizBookId, chapterId, sectionId, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update section:', error);
      set({ quizBooks: previousQuizBooks });
      showErrorToast('節の更新に失敗しました。');
      throw error;
    }
  },

  deleteSection: async (quizBookId: string, chapterId: string, sectionId: string) => {
    try {
      await sectionApi.delete(quizBookId, chapterId, sectionId);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete section:', error);
      showErrorToast('節の削除に失敗しました。');
      throw error;
    }
  },

  // ========== Answer操作 (Optimistic UI) ==========

  saveAnswer: async (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) => {
    const { quizBooks } = get();

    // Optimistic UI: ローカル状態を即座に更新
    const newAttempt = {
      round: 1,
      result,
      resultConfirmFlg: true,
      answeredAt: new Date().toISOString(),
    };

    const updatedQuizBooks = quizBooks.map(book => {
      if (book.id !== quizBookId) return book;

      return {
        ...book,
        chapters: book.chapters.map(chapter => {
          if (chapter.id !== chapterId) return chapter;

          if (sectionId && chapter.sections) {
            return {
              ...chapter,
              sections: chapter.sections.map(section => {
                if (section.id !== sectionId) return section;

                const existingQa = section.questionAnswers?.find(qa => qa.questionNumber === questionNumber);
                if (existingQa) {
                  return {
                    ...section,
                    questionAnswers: section.questionAnswers?.map(qa =>
                      qa.questionNumber === questionNumber
                        ? { ...qa, attempts: [...qa.attempts, { ...newAttempt, round: qa.attempts.length + 1 }] }
                        : qa
                    ),
                  };
                } else {
                  return {
                    ...section,
                    questionAnswers: [
                      ...(section.questionAnswers || []),
                      { questionNumber, attempts: [newAttempt], chapterId, sectionId },
                    ],
                  };
                }
              }),
            };
          } else {
            const existingQa = chapter.questionAnswers?.find(qa => qa.questionNumber === questionNumber);
            if (existingQa) {
              return {
                ...chapter,
                questionAnswers: chapter.questionAnswers?.map(qa =>
                  qa.questionNumber === questionNumber
                    ? { ...qa, attempts: [...qa.attempts, { ...newAttempt, round: qa.attempts.length + 1 }] }
                    : qa
                ),
              };
            } else {
              return {
                ...chapter,
                questionAnswers: [
                  ...(chapter.questionAnswers || []),
                  { questionNumber, attempts: [newAttempt], chapterId },
                ],
              };
            }
          }
        }),
      };
    });

    // 即座にUIを更新
    set({ quizBooks: updatedQuizBooks });

    // バックグラウンドでAPI呼び出し
    answerApi.create(quizBookId, questionNumber, result, chapterId, sectionId)
      .catch(async (error) => {
        console.error('Failed to save answer:', error);
        showErrorToast('回答の保存に失敗しました。再度お試しください。');
        // 失敗したらデータを再取得して正しい状態に戻す
        await get().fetchQuizBooks();
      });
  },

  updateMemo: async (quizBookId: string, answerId: string, memo: string) => {
    try {
      await answerApi.updateMemo(quizBookId, answerId, memo);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update memo:', error);
      showErrorToast('メモの更新に失敗しました。');
      throw error;
    }
  },
  toggleBookmark: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();
    let bookId: string | null = null;
    let answerId: string | null = null;
    let newBookmarkStatus = false;

    // Optimistic UI: 即座にローカル状態を更新
    const updatedQuizBooks = quizBooks.map(book => ({
      ...book,
      chapters: book.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;

        if (sectionId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section => {
              if (section.id !== sectionId) return section;
              return {
                ...section,
                questionAnswers: section.questionAnswers?.map(qa => {
                  if (qa.questionNumber === questionNumber) {
                    bookId = book.id;
                    answerId = qa.id || null;
                    newBookmarkStatus = !qa.isBookmarked;
                    return { ...qa, isBookmarked: newBookmarkStatus };
                  }
                  return qa;
                }),
              };
            }),
          };
        } else {
          return {
            ...chapter,
            questionAnswers: chapter.questionAnswers?.map(qa => {
              if (qa.questionNumber === questionNumber) {
                bookId = book.id;
                answerId = qa.id || null;
                newBookmarkStatus = !qa.isBookmarked;
                return { ...qa, isBookmarked: newBookmarkStatus };
              }
              return qa;
            }),
          };
        }
      }),
    }));

    // 即座にUIを更新
    set({ quizBooks: updatedQuizBooks });

    // バックグラウンドでAPI呼び出し
    if (bookId && answerId) {
      answerApi.updateBookmark(bookId, answerId, newBookmarkStatus)
        .catch(async (error) => {
          console.error('Failed to toggle bookmark:', error);
          showErrorToast('付箋の更新に失敗しました。再度お試しください。');
          await get().fetchQuizBooks();
        });
    }
  },
  
  // ✅ 追加: 付箋の状態を確認
  isBookmarked: (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();
  
    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          // 問題リストを取得
          const questionAnswers = sectionId
            ? chapter.sections?.find(s => s.id === sectionId)?.questionAnswers
            : chapter.questionAnswers;
  
          // 対象の問題を見つける
          const qa = questionAnswers?.find(q => q.questionNumber === questionNumber);
          
          // 付箋の状態を返す（デフォルトはfalse）
          return qa?.isBookmarked || false;
        }
      }
    }
    
    return false;
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
    let bookId: string | null = null;

    // Optimistic UI: 即座にローカル状態を更新
    const updatedQuizBooks = quizBooks.map(book => ({
      ...book,
      chapters: book.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;
        bookId = book.id;

        if (sectionId && chapter.sections) {
          return {
            ...chapter,
            sections: chapter.sections.map(section => {
              if (section.id !== sectionId) return section;
              return { ...section, questionCount: (section.questionCount || 0) + 1 };
            }),
          };
        } else {
          return { ...chapter, questionCount: (chapter.questionCount || 0) + 1 };
        }
      }),
    }));

    set({ quizBooks: updatedQuizBooks });

    // バックグラウンドでAPI呼び出し
    if (bookId) {
      const apiCall = sectionId
        ? sectionApi.update(bookId, chapterId, sectionId, { questionCount: updatedQuizBooks.find(b => b.id === bookId)?.chapters.find(c => c.id === chapterId)?.sections?.find(s => s.id === sectionId)?.questionCount })
        : chapterApi.update(bookId, chapterId, { questionCount: updatedQuizBooks.find(b => b.id === bookId)?.chapters.find(c => c.id === chapterId)?.questionCount });

      apiCall.catch(async (error) => {
        console.error('Failed to add question:', error);
        showErrorToast('問題の追加に失敗しました。再度お試しください。');
        await get().fetchQuizBooks();
      });
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

  deleteLatestAttempt: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();

    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          // 回答データを取得
          const questionAnswers = sectionId
            ? chapter.sections?.find(s => s.id === sectionId)?.questionAnswers
            : chapter.questionAnswers;

          const qa = questionAnswers?.find(q => q.questionNumber === questionNumber);
          if (qa && qa.id) {
            // 最新のattemptのみ削除
            await answerApi.deleteLatest(book.id, qa.id);
          }

          // データを再取得
          await get().fetchQuizBooks();
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