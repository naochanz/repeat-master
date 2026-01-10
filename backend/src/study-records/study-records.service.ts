import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface StudyRecord {
  id: string;
  userId: string;
  quizBookId: string;
  chapterId: string;
  sectionId: string | null;
  questionNumber: number;
  result: '○' | '×';
  round: number;
  answeredAt: Date;
  quizBook?: {
    id: string;
    title: string;
    category?: { name: string };
  };
}

@Injectable()
export class StudyRecordsService {
  constructor(private supabaseService: SupabaseService) {}

  async addStudyRecord(
    userId: string,
    quizBookId: string,
    chapterId: string,
    questionNumber: number,
    result: '○' | '×',
    round: number,
    sectionId?: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 1. 新しいレコードを作成
    await supabase.from('study_records').insert({
      user_id: userId,
      quiz_book_id: quizBookId,
      chapter_id: chapterId,
      section_id: sectionId || null,
      question_number: questionNumber,
      result,
      round,
      answered_at: new Date().toISOString(),
    });

    // 2. 問題集ごとに最新10件のみ保持
    await this.keepLatestPerQuizBook(userId, quizBookId, 10);
  }

  private async keepLatestPerQuizBook(
    userId: string,
    quizBookId: string,
    keepCount: number = 10,
  ): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // 該当する問題集のレコードを取得
    const { data: allRecords } = await supabase
      .from('study_records')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_book_id', quizBookId)
      .order('answered_at', { ascending: false });

    if (allRecords && allRecords.length > keepCount) {
      const idsToDelete = allRecords.slice(keepCount).map((r) => r.id);
      await supabase.from('study_records').delete().in('id', idsToDelete);
    }
  }

  async getRecentRecords(userId: string): Promise<StudyRecord[]> {
    const supabase = this.supabaseService.getClient();

    // 問題集ごとに最新のレコードを取得
    const { data, error } = await supabase
      .from('study_records')
      .select(`
        *,
        quiz_book:quiz_books(
          id,
          title,
          category:categories(name)
        )
      `)
      .eq('user_id', userId)
      .order('answered_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // 問題集ごとに最新1件を取得
    const latestByQuizBook = new Map<string, any>();
    (data || []).forEach((record) => {
      if (!latestByQuizBook.has(record.quiz_book_id)) {
        latestByQuizBook.set(record.quiz_book_id, record);
      }
    });

    const records = Array.from(latestByQuizBook.values())
      .sort((a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime())
      .slice(0, 10);

    return records.map(this.mapToStudyRecord);
  }

  private mapToStudyRecord(data: any): StudyRecord {
    return {
      id: data.id,
      userId: data.user_id,
      quizBookId: data.quiz_book_id,
      chapterId: data.chapter_id,
      sectionId: data.section_id,
      questionNumber: data.question_number,
      result: data.result,
      round: data.round,
      answeredAt: new Date(data.answered_at),
      quizBook: data.quiz_book
        ? {
            id: data.quiz_book.id,
            title: data.quiz_book.title,
            category: data.quiz_book.category,
          }
        : undefined,
    };
  }
}
