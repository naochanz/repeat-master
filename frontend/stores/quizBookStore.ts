import { create } from 'zustand';
import { QuizBook, Chapter, Section, QuestionAnswer, RecentStudyItem, Category } from '@/types/QuizBook';
import { createCategoryActions } from './quizBookActions/categoryActions';
import { createBookActions } from './quizBookActions/bookActions';
import { createAnswerActions } from './quizBookActions/answerActions';
import { createSearchActions } from './quizBookActions/searchActions';

interface QuizBookStore {
  quizBooks: QuizBook[];
  categories: Category[];
  isLoading: boolean;

  // Category
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<string>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // QuizBook + Chapter + Section
  fetchQuizBooks: () => Promise<void>;
  getQuizBookById: (id: string) => QuizBook | undefined;
  createQuizBook: (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => Promise<void>;
  addQuizBook: (title: string, categoryId: string, useSections: boolean, isbn?: string, thumbnailUrl?: string) => Promise<void>;
  updateQuizBook: (id: string, updates: any) => Promise<void>;
  deleteQuizBook: (id: string) => Promise<void>;
  completeQuizBook: (id: string) => Promise<void>;
  reactivateQuizBook: (id: string) => Promise<void>;
  addChapter: (quizBookId: string, chapterNumber: number, title?: string, questionCount?: number) => Promise<void>;
  updateChapter: (quizBookId: string, chapterId: string, updates: any) => Promise<void>;
  deleteChapter: (quizBookId: string, chapterId: string) => Promise<void>;
  addSection: (quizBookId: string, chapterId: string, sectionNumber: number, title?: string, questionCount?: number) => Promise<void>;
  updateSection: (quizBookId: string, chapterId: string, sectionId: string, updates: any) => Promise<void>;
  deleteSection: (quizBookId: string, chapterId: string, sectionId: string) => Promise<void>;

  // Answer
  saveAnswer: (quizBookId: string, questionNumber: number, result: '○' | '×', chapterId?: string, sectionId?: string) => Promise<void>;
  updateMemo: (quizBookId: string, answerId: string, memo: string) => Promise<void>;
  toggleBookmark: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;
  isBookmarked: (chapterId: string, sectionId: string | null, questionNumber: number) => boolean;
  saveMemo: (chapterId: string, sectionId: string | null, questionNumber: number, memo: string) => Promise<void>;
  getQuestionAnswers: (chapterId: string, sectionId: string | null, questionNumber: number) => QuestionAnswer | undefined;
  addQuestionToTarget: (chapterId: string, sectionId: string | null) => Promise<void>;
  deleteQuestionFromTarget: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;
  deleteLatestAttempt: (chapterId: string, sectionId: string | null, questionNumber: number) => Promise<void>;

  // Search
  getChapterById: (chapterId: string) => { book: QuizBook; chapter: Chapter } | undefined;
  getSectionById: (sectionId: string) => { book: QuizBook; chapter: Chapter; section: Section } | undefined;
  getRecentStudyItems: () => RecentStudyItem[];
}

export const useQuizBookStore = create<QuizBookStore>((set, get) => ({
  quizBooks: [],
  categories: [],
  isLoading: false,

  ...createCategoryActions(set, get),
  ...createBookActions(set, get),
  ...createAnswerActions(set, get),
  ...createSearchActions(set, get),
}));
