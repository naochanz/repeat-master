import axios from 'axios';

const isDevelopment = __DEV__;
const LOCAL_IP = '100.64.1.37';

const API_URL = isDevelopment
  ? `http://${LOCAL_IP}:3000`
  : 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// トークンをセット
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 認証API
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (name: string, description?: string) =>
    api.post('/categories', { name, description }),
};

export const quizBookApi = {
  getAll: () => api.get('/quiz-books'),
  getOne: (id: string) => api.get(`/quiz-books/${id}`),  // ✅ 修正
  create: (title: string, categoryId: string, useSections: boolean) =>
    api.post('/quiz-books', { title, categoryId, useSections }),
  update: (id: string, data: any) => api.patch(`/quiz-books/${id}`, data),  // ✅ 修正
  delete: (id: string) => api.delete(`/quiz-books/${id}`),  // ✅ 修正
};

// Chapter API
export const chapterApi = {
  create: (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) =>
    api.post(`/quiz-books/${quizBookId}/chapters`, { chapterNumber, title, questionCount }),  // ✅ 修正
  update: (quizBookId: string, chapterId: string, data: any) =>
    api.patch(`/quiz-books/${quizBookId}/chapters/${chapterId}`, data),  // ✅ 修正
  delete: (quizBookId: string, chapterId: string) =>
    api.delete(`/quiz-books/${quizBookId}/chapters/${chapterId}`),  // ✅ 修正（chpaterId → chapterId）
};

// Section API
export const sectionApi = {
  create: (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) =>
    api.post(`/quiz-books/${quizBookId}/chapters/${chapterId}/sections`, { sectionNumber, title, questionCount }),  // ✅ 修正（quzBookId → quizBookId, chpaterId → chapterId）
  update: (quizBookId: string, chapterId: string, sectionId: string, data: any) => 
    api.patch(`/quiz-books/${quizBookId}/chapters/${chapterId}/sections/${sectionId}`, data),  // ✅ 修正（閉じ括弧追加）
  delete: (quizBookId: string, chapterId: string, sectionId: string) =>
    api.delete(`/quiz-books/${quizBookId}/chapters/${chapterId}/sections/${sectionId}`),  // ✅ 修正（quizBooks → quiz-books）
};

// Answer API
export const answerApi = {
  create: (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) =>
    api.post(`/quiz-books/${quizBookId}/answers`, { questionNumber, result, chapterId, sectionId }),  // ✅ 修正（sectionId追加）
  update: (quizBookId: string, answerId: string, memo: string) =>
    api.patch(`/quiz-books/${quizBookId}/answers/${answerId}`, { memo }),  // ✅ 修正
  delete: (quizBookId: string, answerId: string) =>
    api.delete(`/quiz-books/${quizBookId}/answers/${answerId}`),  // ✅ 修正（スラッシュ追加）
};