// types/QuizBook.ts
export interface QuizBook {
  id: string;
  title: string;
  category: string;
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

export interface QuestionAnswer {
  questionNumber: number;
  memo?: string;
  attempts: {
    round: number;
    result: '○' | '×';
    resultConfirmFlg: boolean;
    answeredAt: Date;
  }[];
}

export interface RecentStudyItem {
  type: 'chapter' | 'section';
  bookId: string;
  bookTitle: string;
  category: string;
  chapterId: String;
  chapterNumber: number;
  chapterTitle: string;
  sectionId?: string;
  sectionNumber?: number;
  sectionTitle?: string;
  lastAnsweredAt: Date;
  lastQuestionNumber: number;
  lastResult: '○' | '×';
}