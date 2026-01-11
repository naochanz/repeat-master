import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CategoriesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(userId: string): Promise<Category[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapToCategory);
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Category not found');
    }

    if (data.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapToCategory(data);
  }

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    const supabase = this.supabaseService.getClient();

    // 同じユーザーの同名カテゴリをチェック
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', createCategoryDto.name)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new ConflictException('Category already exists');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToCategory(data);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
    const supabase = this.supabaseService.getClient();

    // 所有権チェック
    const { data: existing } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Category not found');
    }
    return this.mapToCategory(data);
  }

  async remove(id: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 所有権チェック
    const { data: existing } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // カテゴリに属するquiz_booksを先に削除（CASCADEで章・節・回答も削除される）
    const { error: quizBooksError } = await supabase
      .from('quiz_books')
      .delete()
      .eq('category_id', id)
      .eq('user_id', userId);

    if (quizBooksError) throw quizBooksError;

    // カテゴリを削除
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapToCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
