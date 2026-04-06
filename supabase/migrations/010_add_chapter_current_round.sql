-- chapters テーブルに章レベルの周回管理カラムを追加
ALTER TABLE public.chapters ADD COLUMN current_round INTEGER DEFAULT 0;
