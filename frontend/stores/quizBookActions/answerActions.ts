import { answerDomain } from '@/domain/answerDomain';
import { answerRepository } from '@/repositories/answerRepository';
import { chapterDomain } from '@/domain/chapterDomain';
import { sectionDomain } from '@/domain/sectionDomain';
import { QuestionAnswer } from '@/types/QuizBook';
import { showErrorToast } from '@/utils/toast';
import { useAnalyticsStore } from '../analyticsStore';

export const createAnswerActions = (set: any, get: any) => ({
  saveAnswer: async (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) => {
    const { quizBooks } = get();
    const newAttempt = { round: 1, result, resultConfirmFlg: true, answeredAt: new Date().toISOString() };

    const updatedQuizBooks = quizBooks.map((book: any) => {
      if (book.id !== quizBookId) return book;
      return {
        ...book,
        chapters: book.chapters.map((chapter: any) => {
          if (chapter.id !== chapterId) return chapter;
          if (sectionId && chapter.sections) {
            return {
              ...chapter,
              sections: chapter.sections.map((section: any) => {
                if (section.id !== sectionId) return section;
                const existingQa = section.questionAnswers?.find((qa: any) => qa.questionNumber === questionNumber);
                if (existingQa) {
                  return { ...section, questionAnswers: section.questionAnswers?.map((qa: any) => qa.questionNumber === questionNumber ? { ...qa, attempts: [...qa.attempts, { ...newAttempt, round: qa.attempts.length + 1 }] } : qa) };
                }
                return { ...section, questionAnswers: [...(section.questionAnswers || []), { questionNumber, attempts: [newAttempt], chapterId, sectionId }] };
              }),
            };
          }
          const existingQa = chapter.questionAnswers?.find((qa: any) => qa.questionNumber === questionNumber);
          if (existingQa) {
            return { ...chapter, questionAnswers: chapter.questionAnswers?.map((qa: any) => qa.questionNumber === questionNumber ? { ...qa, attempts: [...qa.attempts, { ...newAttempt, round: qa.attempts.length + 1 }] } : qa) };
          }
          return { ...chapter, questionAnswers: [...(chapter.questionAnswers || []), { questionNumber, attempts: [newAttempt], chapterId }] };
        }),
      };
    });

    set({ quizBooks: updatedQuizBooks });

    answerDomain.createAnswer(quizBookId, questionNumber, result, chapterId, sectionId)
      .then(() => useAnalyticsStore.getState().setNeedsRefresh(true))
      .catch(async (error: any) => {
        console.error('Failed to save answer:', error);
        showErrorToast('回答の保存に失敗しました。再度お試しください。');
        await get().fetchQuizBooks();
      });
  },

  updateMemo: async (quizBookId: string, answerId: string, memo: string) => {
    try {
      await answerDomain.updateMemo(answerId, memo);
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

    const updatedQuizBooks = quizBooks.map((book: any) => ({
      ...book,
      chapters: book.chapters.map((chapter: any) => {
        if (chapter.id !== chapterId) return chapter;
        if (sectionId && chapter.sections) {
          return { ...chapter, sections: chapter.sections.map((section: any) => {
            if (section.id !== sectionId) return section;
            return { ...section, questionAnswers: section.questionAnswers?.map((qa: any) => {
              if (qa.questionNumber === questionNumber) { bookId = book.id; answerId = qa.id || null; newBookmarkStatus = !qa.isBookmarked; return { ...qa, isBookmarked: newBookmarkStatus }; }
              return qa;
            }) };
          }) };
        }
        return { ...chapter, questionAnswers: chapter.questionAnswers?.map((qa: any) => {
          if (qa.questionNumber === questionNumber) { bookId = book.id; answerId = qa.id || null; newBookmarkStatus = !qa.isBookmarked; return { ...qa, isBookmarked: newBookmarkStatus }; }
          return qa;
        }) };
      }),
    }));

    set({ quizBooks: updatedQuizBooks });

    if (answerId) {
      answerDomain.updateBookmark(answerId, newBookmarkStatus)
        .catch(async (error: any) => {
          console.error('Failed to toggle bookmark:', error);
          showErrorToast('付箋の更新に失敗しました。再度お試しください。');
          await get().fetchQuizBooks();
        });
    }
  },

  isBookmarked: (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();
    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          const questionAnswers = sectionId ? chapter.sections?.find((s: any) => s.id === sectionId)?.questionAnswers : chapter.questionAnswers;
          return questionAnswers?.find((q: any) => q.questionNumber === questionNumber)?.isBookmarked || false;
        }
      }
    }
    return false;
  },

  saveMemo: async (chapterId: string, sectionId: string | null, questionNumber: number, memo: string) => {
    const { quizBooks } = get();
    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          const questionAnswers = sectionId ? chapter.sections?.find((s: any) => s.id === sectionId)?.questionAnswers : chapter.questionAnswers;
          const qa = questionAnswers?.find((q: any) => q.questionNumber === questionNumber);
          if (qa) {
            let answerId = qa.id;
            if (!answerId) {
              const serverRecord = await answerRepository.findByQuestion(questionNumber, chapterId, sectionId ?? undefined);
              if (!serverRecord) return;
              answerId = serverRecord.id;
            }
            await get().updateMemo(book.id, answerId, memo);
            return;
          }
        }
      }
    }
  },

  getQuestionAnswers: (chapterId: string, sectionId: string | null, questionNumber: number): QuestionAnswer | undefined => {
    const { quizBooks } = get();
    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          const questionAnswers = sectionId ? chapter.sections?.find((s: any) => s.id === sectionId)?.questionAnswers : chapter.questionAnswers;
          return questionAnswers?.find((q: any) => q.questionNumber === questionNumber);
        }
      }
    }
    return undefined;
  },

  addQuestionToTarget: async (chapterId: string, sectionId: string | null) => {
    const { quizBooks } = get();
    let newQuestionCount: number | undefined;

    const updatedQuizBooks = quizBooks.map((book: any) => ({
      ...book,
      chapters: book.chapters.map((chapter: any) => {
        if (chapter.id !== chapterId) return chapter;
        if (sectionId && chapter.sections) {
          return { ...chapter, sections: chapter.sections.map((section: any) => {
            if (section.id !== sectionId) return section;
            newQuestionCount = (section.questionCount || 0) + 1;
            return { ...section, questionCount: newQuestionCount };
          }) };
        }
        newQuestionCount = (chapter.questionCount || 0) + 1;
        return { ...chapter, questionCount: newQuestionCount };
      }),
    }));

    set({ quizBooks: updatedQuizBooks });

    if (newQuestionCount !== undefined) {
      try {
        if (sectionId) await sectionDomain.update(sectionId, { questionCount: newQuestionCount });
        else await chapterDomain.update(chapterId, { questionCount: newQuestionCount });
      } catch (error) {
        console.error('Failed to add question:', error);
        showErrorToast('問題の追加に失敗しました。');
        await get().fetchQuizBooks();
      }
    }
  },

  deleteQuestionFromTarget: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();
    const previousQuizBooks = [...quizBooks];
    let answerId: string | null = null;

    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          const questionAnswers = sectionId ? chapter.sections?.find((s: any) => s.id === sectionId)?.questionAnswers : chapter.questionAnswers;
          const qa = questionAnswers?.find((q: any) => q.questionNumber === questionNumber);
          if (qa?.id) { answerId = qa.id; }
          break;
        }
      }
      if (answerId) break;
    }

    set({
      quizBooks: quizBooks.map((book: any) => ({
        ...book,
        chapters: book.chapters.map((chapter: any) => {
          if (chapter.id !== chapterId) return chapter;
          if (sectionId && chapter.sections) {
            return { ...chapter, sections: chapter.sections.map((section: any) => {
              if (section.id !== sectionId) return section;
              return { ...section, questionCount: Math.max(0, (section.questionCount || 0) - 1), questionAnswers: section.questionAnswers?.filter((qa: any) => qa.questionNumber !== questionNumber) };
            }) };
          }
          return { ...chapter, questionCount: Math.max(0, (chapter.questionCount || 0) - 1), questionAnswers: chapter.questionAnswers?.filter((qa: any) => qa.questionNumber !== questionNumber) };
        }),
      }))
    });

    if (answerId) {
      answerDomain.deleteAnswer(answerId)
        .then(async () => {
          const prevChapter = previousQuizBooks.flatMap((b: any) => b.chapters).find((c: any) => c.id === chapterId);
          if (sectionId) {
            const section = prevChapter?.sections?.find((s: any) => s.id === sectionId);
            if (section?.questionCount > 0) await sectionDomain.update(sectionId, { questionCount: section.questionCount - 1 });
          } else {
            if (prevChapter?.questionCount > 0) await chapterDomain.update(chapterId, { questionCount: prevChapter.questionCount - 1 });
          }
          get().fetchQuizBooks();
        })
        .catch(async (error: any) => {
          console.error('Failed to delete question:', error);
          set({ quizBooks: previousQuizBooks });
          showErrorToast('問題の削除に失敗しました。再度お試しください。');
        });
    }
  },

  deleteLatestAttempt: async (chapterId: string, sectionId: string | null, questionNumber: number) => {
    const { quizBooks } = get();
    const previousQuizBooks = [...quizBooks];
    let answerId: string | null = null;

    for (const book of quizBooks) {
      for (const chapter of book.chapters) {
        if (chapter.id === chapterId) {
          const questionAnswers = sectionId ? chapter.sections?.find((s: any) => s.id === sectionId)?.questionAnswers : chapter.questionAnswers;
          const qa = questionAnswers?.find((q: any) => q.questionNumber === questionNumber);
          if (qa?.id) { answerId = qa.id; }
          break;
        }
      }
      if (answerId) break;
    }

    set({
      quizBooks: quizBooks.map((book: any) => ({
        ...book,
        chapters: book.chapters.map((chapter: any) => {
          if (chapter.id !== chapterId) return chapter;
          const updateQA = (qas: any[]) => qas?.map((qa: any) => {
            if (qa.questionNumber !== questionNumber) return qa;
            const newAttempts = qa.attempts.slice(0, -1);
            return newAttempts.length > 0 ? { ...qa, attempts: newAttempts } : qa;
          }).filter((qa: any) => qa.questionNumber !== questionNumber || qa.attempts.length > 0);
          if (sectionId && chapter.sections) {
            return { ...chapter, sections: chapter.sections.map((section: any) => section.id !== sectionId ? section : { ...section, questionAnswers: updateQA(section.questionAnswers) }) };
          }
          return { ...chapter, questionAnswers: updateQA(chapter.questionAnswers) };
        }),
      }))
    });

    if (answerId) {
      answerDomain.deleteLatestAttempt(answerId)
        .then(() => get().fetchQuizBooks())
        .catch(async (error: any) => {
          console.error('Failed to delete latest attempt:', error);
          set({ quizBooks: previousQuizBooks });
          showErrorToast('履歴の削除に失敗しました。再度お試しください。');
        });
    }
  },
});
