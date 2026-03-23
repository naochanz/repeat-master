import { categoryDomain } from '@/domain/categoryDomain';
import { showErrorToast } from '@/utils/toast';
import { useAnalyticsStore } from '../analyticsStore';

export const createCategoryActions = (set: any, get: any) => ({
  fetchCategories: async () => {
    try {
      const categories = await categoryDomain.fetchAll();
      set({ categories });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showErrorToast('カテゴリの取得に失敗しました。');
    }
  },

  createCategory: async (name: string) => {
    try {
      const category = await categoryDomain.create(name);
      await get().fetchCategories();
      return category.id;
    } catch (error) {
      console.error('Failed to create category:', error);
      showErrorToast('カテゴリの作成に失敗しました。');
      throw error;
    }
  },

  updateCategory: async (id: string, name: string) => {
    set({ isLoading: true });
    try {
      await categoryDomain.update(id, name);
      await get().fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      showErrorToast('カテゴリの更新に失敗しました。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true });
    try {
      await categoryDomain.remove(id);
      useAnalyticsStore.getState().setNeedsRefresh(true);
      await get().fetchCategories();
      await get().fetchQuizBooks();
    } catch (error) {
      console.error('Failed to delete category:', error);
      showErrorToast('カテゴリの削除に失敗しました。再度お試しください。');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
});
