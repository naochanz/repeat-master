-- study_records を問題集ごとに最新10件のみ保持するトリガー
-- バックエンド廃止に伴い、JS側で行っていた制限をDB側に移行

CREATE OR REPLACE FUNCTION public.cleanup_study_records()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.study_records
  WHERE id IN (
    SELECT id FROM public.study_records
    WHERE user_id = NEW.user_id
      AND quiz_book_id = NEW.quiz_book_id
    ORDER BY answered_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_study_records
  AFTER INSERT ON public.study_records
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_study_records();
