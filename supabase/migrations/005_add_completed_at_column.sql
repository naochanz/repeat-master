-- =============================================
-- Add completed_at column to quiz_books
-- 問題集の完了日時を記録（トロフィー化）
-- =============================================

ALTER TABLE public.quiz_books
ADD COLUMN completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_quiz_books_completed_at ON public.quiz_books(completed_at);

COMMENT ON COLUMN public.quiz_books.completed_at IS 'Timestamp when quiz book was marked as completed (trophy). NULL means active.';
