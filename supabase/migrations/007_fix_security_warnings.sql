-- =============================================
-- セキュリティ警告の解消
-- =============================================

-- 1. handle_updated_at: search_pathを固定
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 2. handle_new_user: search_pathを固定
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. categoriesの古い permissive INSERT ポリシーを削除
-- (006で user_id ベースのポリシーに置き換え済みだが、古いポリシーが残っている)
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
