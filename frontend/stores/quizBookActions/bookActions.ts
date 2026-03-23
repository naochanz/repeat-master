import { quizBookDomain } from '@/domain/quizBookDomain';
import { chapterDomain } from '@/domain/chapterDomain';
import { sectionDomain } from '@/domain/sectionDomain';
import { showErrorToast } from '@/utils/toast';
import { useAnalyticsStore } from '../analyticsStore';

export const createBookActions = (set: any, get: any) => ({
  fetchQuizBooks: async () => {
    try {
      const quizBooks = await quizBookDomain.fetchAll();
      set({ quizBooks });
    } catch (error) {
      console.error('Failed to fetch quiz books:', error);
      showErrorToast('問題集の取得に失敗しました。');
    }
  },

  getQuizBookById: (id: string) => get().quizBooks.find((book: any) => book.id === id),

  createQuizBook: async (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => {
    set({ isLoading: true });
    try {
      await quizBookDomain.create(title, categoryId, useSections, isbn, thumbnailUrl);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to create quiz book:', error);
      showErrorToast('問題集の作成に失敗しました。再度お試しください。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addQuizBook: async (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => {
    return get().createQuizBook(title, categoryId, useSections, isbn, thumbnailUrl);
  },

  updateQuizBook: async (id: string, updates: any) => {
    set({ isLoading: true });
    try {
      await quizBookDomain.update(id, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update quiz book:', error);
      showErrorToast('問題集の更新に失敗しました。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteQuizBook: async (id: string) => {
    set({ isLoading: true });
    try {
      await quizBookDomain.remove(id);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete quiz book:', error);
      showErrorToast('問題集の削除に失敗しました。再度お試しください。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  completeQuizBook: async (id: string) => {
    set({ isLoading: true });
    try {
      await quizBookDomain.complete(id);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to complete quiz book:', error);
      showErrorToast('問題集の完了に失敗しました。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reactivateQuizBook: async (id: string) => {
    set({ isLoading: true });
    try {
      await quizBookDomain.reactivate(id);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to reactivate quiz book:', error);
      showErrorToast('問題集の再開に失敗しました。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Chapter CRUD
  addChapter: async (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) => {
    set({ isLoading: true });
    try {
      await chapterDomain.create(quizBookId, chapterNumber, title, questionCount);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to add chapter:', error);
      showErrorToast('章の追加に失敗しました。再度お試しください。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateChapter: async (quizBookId: string, chapterId: string, updates: any) => {
    set({ isLoading: true });
    try {
      await chapterDomain.update(chapterId, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update chapter:', error);
      showErrorToast('章の更新に失敗しました。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteChapter: async (quizBookId: string, chapterId: string) => {
    set({ isLoading: true });
    try {
      await chapterDomain.remove(chapterId);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      showErrorToast('章の削除に失敗しました。再度お試しください。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Section CRUD
  addSection: async (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) => {
    set({ isLoading: true });
    try {
      await sectionDomain.create(chapterId, sectionNumber, title, questionCount);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to add section:', error);
      showErrorToast('節の追加に失敗しました。再度お試しください。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSection: async (quizBookId: string, chapterId: string, sectionId: string, updates: any) => {
    set({ isLoading: true });
    try {
      await sectionDomain.update(sectionId, updates);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to update section:', error);
      showErrorToast('節の更新に失敗しました。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSection: async (quizBookId: string, chapterId: string, sectionId: string) => {
    set({ isLoading: true });
    try {
      await sectionDomain.remove(sectionId);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete section:', error);
      showErrorToast('節の削除に失敗しました。再度お試しください。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
});
