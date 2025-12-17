// ✅ Category インターフェースを追加
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizBook {
  id: string;
  title: string;
  category: Category; // ✅ string から Category に変更
  categoryId: string; // ✅ 追加
  chapterCount: number;
  chapters: Chapter[];
  currentRate: number;
  createdAt: Date;
  updatedAt: Date;
  useSections: boolean;
  currentRound: number;
}

export interface Chapter {
  id: string;
  title: string; // ✅ nullable に変更
  chapterNumber: number;
  chapterRate: number;
  sections?: Section[];
  questionCount?: number;
  questionAnswers?: QuestionAnswer[];
}

export interface Section {
  id: string;
  title: string; // ✅ nullable に変更
  sectionNumber: number;
  questionCount: number;
  questionAnswers?: QuestionAnswer[];
}

export interface QuestionAnswer {
  id?: string; // ✅ 追加（バックエンドから返ってくる）
  questionNumber: number;
  memo?: string;
  attempts: {
    round: number;
    result: '○' | '×';
    resultConfirmFlg: boolean;
    answeredAt: Date;
  }[];
  chapterId?: string; // ✅ 追加
  sectionId?: string; // ✅ 追加
}

export interface RecentStudyItem {
  type: 'chapter' | 'section';
  bookId: string;
  bookTitle: string;
  category: string;
  chapterId: string; // ✅ String → string
  chapterNumber: number;
  chapterTitle: string;
  sectionId?: string;
  sectionNumber?: number;
  sectionTitle?: string;
  lastAnsweredAt: Date;
  lastQuestionNumber: number;
  lastResult: '○' | '×';
}