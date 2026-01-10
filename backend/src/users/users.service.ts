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
