import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: Supabaseトークンを自動的に付与
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('API Request:', config.url, 'Session:', !!session);
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
    console.log('Token added to request');
  } else {
    console.log('No session/token available');
  }
  return config;
});

// レスポンスインターセプター: エラーログ
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.config?.url, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// 後方互換性のため（不要だが残す）
export const setAuthToken = (token: string) => {
  // Supabaseセッションから自動取得するため不要
};

// 認証API（Supabase Authを使用）
export const authApi = {
  register: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    return { data };
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

// カテゴリAPI
export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (name: string, description?: string) =>
    api.post('/categories', { name, description }),
  update: (id: string, data: { name: string; description?: string }) =>
    api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// QuizBook API
export const quizBookApi = {
  getAll: () => api.get('/quiz-books'),
  getOne: (id: string) => api.get(`/quiz-books/${id}`),
  create: (title: string, categoryId: string, useSections: boolean) =>
    api.post('/quiz-books', { title, categoryId, useSections }),
  update: (id: string, data: any) => api.patch(`/quiz-books/${id}`, data),
  delete: (id: string) => api.delete(`/quiz-books/${id}`),
  getAnalytics: (id: string) => api.get(`/quiz-books/${id}/analytics`),
};

// Chapter API
export const chapterApi = {
  create: (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) =>
    api.post(`/quiz-books/${quizBookId}/chapters`, { chapterNumber, title, questionCount }),
  update: (quizBookId: string, chapterId: string, data: any) =>
    api.patch(`/quiz-books/${quizBookId}/chapters/${chapterId}`, data),
  delete: (quizBookId: string, chapterId: string) =>
    api.delete(`/quiz-books/${quizBookId}/chapters/${chapterId}`),
};

// Section API
export const sectionApi = {
  create: (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) =>
    api.post(`/quiz-books/${quizBookId}/chapters/${chapterId}/sections`, { sectionNumber, title, questionCount }),
  update: (quizBookId: string, chapterId: string, sectionId: string, data: any) =>
    api.patch(`/quiz-books/${quizBookId}/chapters/${chapterId}/sections/${sectionId}`, data),
  delete: (quizBookId: string, chapterId: string, sectionId: string) =>
    api.delete(`/quiz-books/${quizBookId}/chapters/${chapterId}/sections/${sectionId}`),
};

// Answer API
export const answerApi = {
  create: (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) =>
    api.post(`/quiz-books/${quizBookId}/answers`, { questionNumber, result, chapterId, sectionId }),
  updateMemo: (quizBookId: string, answerId: string, memo: string) =>
    api.patch(`/quiz-books/${quizBookId}/answers/${answerId}`, { memo }),
  updateBookmark: async (quizBookId: string, answerId: string, isBookmarked: boolean) =>
    api.patch(`/quiz-books/${quizBookId}/answers/${answerId}`, { isBookmarked }),
  delete: (quizBookId: string, answerId: string) =>
    api.delete(`/quiz-books/${quizBookId}/answers/${answerId}`),
  deleteLatest: (quizBookId: string, answerId: string) =>
    api.delete(`/quiz-books/${quizBookId}/answers/${answerId}/latest`),
};

// User API
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateGoal: (goal: string) => api.patch('/users/goal', { goal }),
};

// Study Record API
export const studyRecordApi = {
  getRecent: () => api.get('/study-records/recent'),
};
