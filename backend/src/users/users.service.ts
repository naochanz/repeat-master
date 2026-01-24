import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateUserGoalDto } from './dto/update-user-goal.dto';

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  goal: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findById(id: string): Promise<UserProfile | null> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToUserProfile(data);
  }

  async findOne(userId: string): Promise<UserProfile> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateGoal(userId: string, updateUserGoalDto: UpdateUserGoalDto): Promise<UserProfile> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('profiles')
      .update({ goal: updateUserGoalDto.goal })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserProfile(data);
  }

  async deleteAccount(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 1. 問題集に関連するデータを削除（カスケードで削除されるが念のため）
    // study_records → question_answers → sections → chapters → quiz_books → categories

    // study_recordsを削除
    await supabase
      .from('study_records')
      .delete()
      .eq('user_id', userId);

    // quiz_booksを取得して関連データを削除
    const { data: quizBooks } = await supabase
      .from('quiz_books')
      .select('id')
      .eq('user_id', userId);

    if (quizBooks && quizBooks.length > 0) {
      const quizBookIds = quizBooks.map(qb => qb.id);

      // chaptersを取得
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .in('quiz_book_id', quizBookIds);

      if (chapters && chapters.length > 0) {
        const chapterIds = chapters.map(c => c.id);

        // sectionsを取得
        const { data: sections } = await supabase
          .from('sections')
          .select('id')
          .in('chapter_id', chapterIds);

        if (sections && sections.length > 0) {
          const sectionIds = sections.map(s => s.id);

          // question_answers（section経由）を削除
          await supabase
            .from('question_answers')
            .delete()
            .in('section_id', sectionIds);
        }

        // question_answers（chapter経由）を削除
        await supabase
          .from('question_answers')
          .delete()
          .in('chapter_id', chapterIds);

        // sectionsを削除
        await supabase
          .from('sections')
          .delete()
          .in('chapter_id', chapterIds);

        // chaptersを削除
        await supabase
          .from('chapters')
          .delete()
          .in('quiz_book_id', quizBookIds);
      }

      // quiz_booksを削除
      await supabase
        .from('quiz_books')
        .delete()
        .eq('user_id', userId);
    }

    // 2. categoriesを削除
    await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId);

    // 3. profilesを削除
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 4. Supabase Authのユーザーを削除
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Failed to delete auth user:', authError);
      throw new Error('Failed to delete user account');
    }
  }

  private mapToUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      goal: data.goal,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
