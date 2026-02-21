-- =============================================
-- RLS パフォーマンス改善
-- auth.uid() → (select auth.uid()) に変更
-- =============================================

-- =============================================
-- Profiles
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- =============================================
-- Categories
-- =============================================
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
CREATE POLICY "Users can view own categories"
  ON public.categories FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =============================================
-- Quiz Books
-- =============================================
DROP POLICY IF EXISTS "Users can view own quiz books" ON public.quiz_books;
CREATE POLICY "Users can view own quiz books"
  ON public.quiz_books FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own quiz books" ON public.quiz_books;
CREATE POLICY "Users can create own quiz books"
  ON public.quiz_books FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own quiz books" ON public.quiz_books;
CREATE POLICY "Users can update own quiz books"
  ON public.quiz_books FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own quiz books" ON public.quiz_books;
CREATE POLICY "Users can delete own quiz books"
  ON public.quiz_books FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =============================================
-- Chapters
-- =============================================
DROP POLICY IF EXISTS "Users can view own chapters" ON public.chapters;
CREATE POLICY "Users can view own chapters"
  ON public.chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = chapters.quiz_book_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create chapters in own quiz books" ON public.chapters;
CREATE POLICY "Users can create chapters in own quiz books"
  ON public.chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = quiz_book_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own chapters" ON public.chapters;
CREATE POLICY "Users can update own chapters"
  ON public.chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = chapters.quiz_book_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own chapters" ON public.chapters;
CREATE POLICY "Users can delete own chapters"
  ON public.chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_books
      WHERE quiz_books.id = chapters.quiz_book_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

-- =============================================
-- Sections
-- =============================================
DROP POLICY IF EXISTS "Users can view own sections" ON public.sections;
CREATE POLICY "Users can view own sections"
  ON public.sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = sections.chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create sections in own chapters" ON public.sections;
CREATE POLICY "Users can create sections in own chapters"
  ON public.sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own sections" ON public.sections;
CREATE POLICY "Users can update own sections"
  ON public.sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = sections.chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own sections" ON public.sections;
CREATE POLICY "Users can delete own sections"
  ON public.sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = sections.chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

-- =============================================
-- Question Answers
-- =============================================
DROP POLICY IF EXISTS "Users can view own question answers" ON public.question_answers;
CREATE POLICY "Users can view own question answers"
  ON public.question_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = question_answers.chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create question answers" ON public.question_answers;
CREATE POLICY "Users can create question answers"
  ON public.question_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own question answers" ON public.question_answers;
CREATE POLICY "Users can update own question answers"
  ON public.question_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = question_answers.chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own question answers" ON public.question_answers;
CREATE POLICY "Users can delete own question answers"
  ON public.question_answers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.quiz_books ON quiz_books.id = chapters.quiz_book_id
      WHERE chapters.id = question_answers.chapter_id
      AND quiz_books.user_id = (select auth.uid())
    )
  );

-- =============================================
-- Study Records
-- =============================================
DROP POLICY IF EXISTS "Users can view own study records" ON public.study_records;
CREATE POLICY "Users can view own study records"
  ON public.study_records FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own study records" ON public.study_records;
CREATE POLICY "Users can create own study records"
  ON public.study_records FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own study records" ON public.study_records;
CREATE POLICY "Users can delete own study records"
  ON public.study_records FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =============================================
-- Feedback
-- =============================================
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
CREATE POLICY "Users can insert own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can read all feedback" ON public.feedback;
CREATE POLICY "Service role can read all feedback"
  ON public.feedback FOR SELECT
  TO service_role
  USING (true);
