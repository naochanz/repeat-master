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
  getOne: (id: string) => api.get('/quiz-books/${id}'),
  create: (title: string, categoryId: string, useSections: boolean) =>
    api.post('/quiz-books', { title, categoryId, useSections }),
  update: (id: string, data: any) => api.patch('/quiz-books/${id}', data),
  delete: (id: string) => api.delete('quiz-books/${id}'),
};
// Chapter API
export const chapterApi = {
  create: (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) =>
    api.post('/quiz-books/${quizBookId}/chapters', { chapterNumber, title, questionCount }),
  update: (quizBookId: string, chapterId: string, data: any) =>
    api.patch('/quiz-books/${quizBookId}/chapters/${chapterId}', data),
  delete: (quizBookId: string, chapterId: string) =>
    api.delete('/quiz-books/${quizBookId}/chapters/${chpaterId}'),
};

//Section API
export const sectionApi = {
  create: (quzBookId: string, chpaterId: string, sectionNumber: number, title?: string, questionCount?: number) =>
    api.post('/quiz-books/${quizBookId}/chapters/${chapterId}/sections', {sectionNumber, title, questionCount }),
  update: (quizBookId: string, chapterId: string, sectionId: string, data: any) => 
    api.patch('/quiz-books/${quizBookId}/chapters/${chapterId}/sections/${sectionId}, data'),
  delete: (quizBookId: string, chapterId: string, sectionId: string) =>
  api.delete('/quizBooks/${quizBookId}/chapters/${chapterId}/sections/${sectionId}'),
};

//Answer API
export const answerApi = {
  create: (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) =>
  api.post('/quizBooks/${quizBookId}/answers', {questionNumber, result, chapterId }),
  update: (quizBookId: string, answerId: string, memo: string) =>
  api.patch('/quiz-books/${quizBookId}/answers/${answerId}', { memo }),
  delete: (quizBookId: string, answerId: string) =>
  api.delete('/quiz-books/${quizBookId}answers/${answerId}'),
};