-- =============================================
-- Add user_id to categories table
-- =============================================

-- 1. user_id カラムを追加
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- 3. 既存のカテゴリにuser_idがない場合、そのカテゴリを使用している問題集のユーザーを設定
-- (既存データがある場合のマイグレーション)
UPDATE public.categories c
SET user_id = (
  SELECT qb.user_id
  FROM public.quiz_books qb
  WHERE qb.category_id = c.id
  LIMIT 1
)
WHERE c.user_id IS NULL;

-- 4. RLS ポリシーを更新
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 同一ユーザー内でのカテゴリ名重複を防ぐユニーク制約を変更
-- まず既存の制約を削除
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- ユーザーごとにユニークな制約を追加
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name_unique
ON public.categories(user_id, name);
