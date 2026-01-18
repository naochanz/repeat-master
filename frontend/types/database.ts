export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          goal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_books: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          chapter_count: number;
          current_rate: number;
          use_sections: boolean;
          current_round: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          title: string;
          chapter_count?: number;
          current_rate?: number;
          use_sections?: boolean;
          current_round?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          title?: string;
          chapter_count?: number;
          current_rate?: number;
          use_sections?: boolean;
          current_round?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          quiz_book_id: string;
          chapter_number: number;
          title: string | null;
          chapter_rate: number;
          question_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_book_id: string;
          chapter_number: number;
          title?: string | null;
          chapter_rate?: number;
          question_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quiz_book_id?: string;
          chapter_number?: number;
          title?: string | null;
          chapter_rate?: number;
          question_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sections: {
        Row: {
          id: string;
          chapter_id: string;
          section_number: number;
          title: string | null;
          question_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          section_number: number;
          title?: string | null;
          question_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          section_number?: number;
          title?: string | null;
          question_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      question_answers: {
        Row: {
          id: string;
          question_number: number;
          chapter_id: string | null;
          section_id: string | null;
          memo: string | null;
          is_bookmarked: boolean;
          attempts: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_number: number;
          chapter_id?: string | null;
          section_id?: string | null;
          memo?: string | null;
          is_bookmarked?: boolean;
          attempts?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_number?: number;
          chapter_id?: string | null;
          section_id?: string | null;
          memo?: string | null;
          is_bookmarked?: boolean;
          attempts?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_records: {
        Row: {
          id: string;
          user_id: string;
          quiz_book_id: string;
          chapter_id: string;
          section_id: string | null;
          question_number: number;
          result: string;
          round: number;
          answered_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_book_id: string;
          chapter_id: string;
          section_id?: string | null;
          question_number: number;
          result: string;
          round: number;
          answered_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_book_id?: string;
          chapter_id?: string;
          section_id?: string | null;
          question_number?: number;
          result?: string;
          round?: number;
          answered_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// 型エイリアス
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type QuizBook = Database['public']['Tables']['quiz_books']['Row'];
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type Section = Database['public']['Tables']['sections']['Row'];
export type QuestionAnswer = Database['public']['Tables']['question_answers']['Row'];
export type StudyRecord = Database['public']['Tables']['study_records']['Row'];

// 回答履歴の型
export interface Attempt {
  round: number;
  result: '○' | '×';
  resultConfirmFlg: boolean;
  answeredAt: string;
}
