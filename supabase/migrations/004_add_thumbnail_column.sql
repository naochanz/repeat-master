-- =============================================
-- Add thumbnail column to quiz_books
-- Google Books APIから取得したサムネイル画像のURLを保存
-- =============================================

ALTER TABLE public.quiz_books
ADD COLUMN thumbnail_url TEXT;

COMMENT ON COLUMN public.quiz_books.thumbnail_url IS 'URL to book cover thumbnail from Google Books API';
