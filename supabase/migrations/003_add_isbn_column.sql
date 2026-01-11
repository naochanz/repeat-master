-- =============================================
-- Add ISBN column to quiz_books
-- ISBNで同じ問題集を識別し、将来的に構造の共有を可能にする
-- =============================================

-- ISBNカラムを追加（ISBN-13は13桁、ISBN-10は10桁）
ALTER TABLE public.quiz_books
ADD COLUMN isbn VARCHAR(13);

-- ISBNにインデックスを追加（将来の検索用）
CREATE INDEX IF NOT EXISTS idx_quiz_books_isbn ON public.quiz_books(isbn);

-- コメント追加
COMMENT ON COLUMN public.quiz_books.isbn IS 'ISBN-13 or ISBN-10 for book identification';
