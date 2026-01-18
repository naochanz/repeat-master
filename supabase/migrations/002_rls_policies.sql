-- =============================================
-- DoriLoop - RLS Policies
-- =============================================

-- RLSを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Profiles ポリシー
-- =============================================

-- ユーザーは自分のプロファイルのみ閲覧可能
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- ユーザーは自分のプロファイルのみ更新可能
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- Categories ポリシー
-- =============================================

-- 認証済みユーザーはカテゴリを閲覧可能
CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザーはカテゴリを作成可能
CREATE POLICY "Authenticated users can create categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- Quiz Books ポリシー
-- =============================================

-- ユーザーは自分の問題集のみ閲覧可能
CREATE POLICY "Users can view own quiz books"
  ON public.quiz_books FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の問題集を作成可能
CREATE POLICY "Users can create own quiz books"
  ON public.quiz_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の問題集のみ更新可能
CREATE POLICY "Users can update own quiz books"
  ON public.quiz_books FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の問題集のみ削除可能
CREATE POLICY "Users can delete own quiz books"
  ON public.quiz_books FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Chapters ポリシー
-- =============================================

-- ユーザーは自分の問題集に属するチャプターのみ閲覧可能
CREATE POLICY "Users can view own chapters"
  ON public.chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = chapters.quiz_book_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題集にチャプターを作成可能
CREATE POLICY "Users can create chapters in own quiz books"
  ON public.chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = quiz_book_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題集のチャプターのみ更新可能
CREATE POLICY "Users can update own chapters"
  ON public.chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = chapters.quiz_book_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題集のチャプターのみ削除可能
CREATE POLICY "Users can delete own chapters"
  ON public.chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = chapters.quiz_book_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- =============================================
-- Sections ポリシー
-- =============================================

-- ユーザーは自分の問題集に属するセクションのみ閲覧可能
CREATE POLICY "Users can view own sections"
  ON public.sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = sections.chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題集にセクションを作成可能
CREATE POLICY "Users can create sections in own chapters"
  ON public.sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題集のセクションのみ更新可能
CREATE POLICY "Users can update own sections"
  ON public.sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = sections.chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題集のセクションのみ削除可能
CREATE POLICY "Users can delete own sections"
  ON public.sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = sections.chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- =============================================
-- Question Answers ポリシー
-- =============================================

-- ユーザーは自分の問題回答のみ閲覧可能
CREATE POLICY "Users can view own question answers"
  ON public.question_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = question_answers.chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題集に回答を作成可能
CREATE POLICY "Users can create question answers"
  ON public.question_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題回答のみ更新可能
CREATE POLICY "Users can update own question answers"
  ON public.question_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = question_answers.chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- ユーザーは自分の問題回答のみ削除可能
CREATE POLICY "Users can delete own question answers"
  ON public.question_answers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = question_answers.chapter_id
      AND quiz_books.user_id = auth.uid()
    )
  );

-- =============================================
-- Study Records ポリシー
-- =============================================

-- ユーザーは自分の学習記録のみ閲覧可能
CREATE POLICY "Users can view own study records"
  ON public.study_records FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の学習記録を作成可能
CREATE POLICY "Users can create own study records"
  ON public.study_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の学習記録のみ削除可能
CREATE POLICY "Users can delete own study records"
  ON public.study_records FOR DELETE
  USING (auth.uid() = user_id);
