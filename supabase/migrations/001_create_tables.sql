-- =============================================
-- Repeat Master - Supabase Migration
-- =============================================

-- 1. Profiles テーブル (auth.usersを拡張)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories テーブル
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quiz Books テーブル
CREATE TABLE IF NOT EXISTS public.quiz_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  chapter_count INTEGER DEFAULT 0,
  current_rate DECIMAL(5,2) DEFAULT 0,
  use_sections BOOLEAN DEFAULT FALSE,
  current_round INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Chapters テーブル
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_book_id UUID NOT NULL REFERENCES public.quiz_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  chapter_rate DECIMAL(5,2) DEFAULT 0,
  question_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sections テーブル
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL,
  title TEXT,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Question Answers テーブル
CREATE TABLE IF NOT EXISTS public.question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  memo TEXT,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  attempts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Study Records テーブル
CREATE TABLE IF NOT EXISTS public.study_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_book_id UUID NOT NULL REFERENCES public.quiz_books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL,
  section_id UUID,
  question_number INTEGER NOT NULL,
  result VARCHAR(1) NOT NULL CHECK (result IN ('○', '×')),
  round INTEGER NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- インデックス
-- =============================================

CREATE INDEX IF NOT EXISTS idx_quiz_books_user_id ON public.quiz_books(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_books_category_id ON public.quiz_books(category_id);
CREATE INDEX IF NOT EXISTS idx_chapters_quiz_book_id ON public.chapters(quiz_book_id);
CREATE INDEX IF NOT EXISTS idx_sections_chapter_id ON public.sections(chapter_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_chapter_id ON public.question_answers(chapter_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_section_id ON public.question_answers(section_id);
CREATE INDEX IF NOT EXISTS idx_study_records_user_id ON public.study_records(user_id);
CREATE INDEX IF NOT EXISTS idx_study_records_answered_at ON public.study_records(answered_at);

-- =============================================
-- Updated_at 自動更新トリガー
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを適用
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_quiz_books
  BEFORE UPDATE ON public.quiz_books
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_chapters
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sections
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_question_answers
  BEFORE UPDATE ON public.question_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 新規ユーザー登録時にProfileを自動作成
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
