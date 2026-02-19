import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FeedbackService {
  constructor(private supabaseService: SupabaseService) {}

  async create(userId: string, message: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('feedback').insert({
      user_id: userId,
      message,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  }
}
