// ✅ Category インターフェースを追加
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizBook {
  id: string;
  title: string;
  category: Category;
  categoryId: string; 
  chapterCount: number;
  chapters: Chapter[];
  currentRate: number;
  createdAt: string;
  updatedAt: string;
  useSections: boolean;
  currentRound: number;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  chapterRate: number;
  sections?: Section[];
  questionCount?: number;
  questionAnswers?: QuestionAnswer[];
}

export interface Section {
  id: string;
  title: string;
  sectionNumber: number;
  questionCount: number;
  questionAnswers?: QuestionAnswer[];
}

export interface Attempt {
  round: number;
  result: '○' | '×';
  resultConfirmFlg: boolean;
  answeredAt: string;
}

export interface QuestionAnswer {
  id?: string; 
  questionNumber: number;
  memo?: string;
  isBookmarked?: boolean;
  attempts: Attempt[];
  chapterId?: string;
  sectionId?: string;
}

export interface RecentStudyItem {
  type: 'chapter' | 'section';
  bookId: string;
  bookTitle: string;
  category: string;
  chapterId: string; 
  chapterNumber: number;
  chapterTitle: string;
  sectionId?: string;
  sectionNumber?: number;
  sectionTitle?: string;
  lastAnsweredAt: string | Date;
  lastQuestionNumber: number;
  lastResult: '○' | '×';
}