import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CategoriesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(): Promise<Category[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapToCategory);
  }

  async findOne(id: string): Promise<Category> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Category not found');
    }
    return this.mapToCategory(data);
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const supabase = this.supabaseService.getClient();

    // 重複チェック
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', createCategoryDto.name)
      .single();

    if (existing) {
      throw new ConflictException('Category already exists');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: createCategoryDto.name,
        description: createCategoryDto.description,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToCategory(data);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const supabase = this.supabaseService.getClient();
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

  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
