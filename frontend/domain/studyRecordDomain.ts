import { studyRecordRepository } from '@/repositories/studyRecordRepository';
import { StudyRecord } from '@/types/user';

export const studyRecordDomain = {
  async fetchRecent(): Promise<StudyRecord[]> {
    const rawRecords = await studyRecordRepository.findRecentWithQuizBook();

    // 問題集ごとに最新1件を取得
    const latestByQuizBook = new Map<string, any>();
    rawRecords.forEach((record) => {
      if (!latestByQuizBook.has(record.quiz_book_id)) {
        latestByQuizBook.set(record.quiz_book_id, record);
      }
    });

    const records = Array.from(latestByQuizBook.values())
      .sort((a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime())
      .slice(0, 10);

    // chapter/section 番号を取得
    const chapterIds = [...new Set(records.map((r: any) => r.chapter_id))] as string[];
    const sectionIds = [...new Set(records.map((r: any) => r.section_id).filter(Boolean))] as string[];

    const [chapterMap, sectionMap] = await Promise.all([
      studyRecordRepository.findChapterNumbers(chapterIds),
      studyRecordRepository.findSectionNumbers(sectionIds),
    ]);

    return records.map((record: any): StudyRecord => ({
      id: record.id,
      quizBook: record.quiz_book
        ? {
            id: record.quiz_book.id,
            title: record.quiz_book.title,
            category: record.quiz_book.category || { id: '', name: '' },
          }
        : { id: '', title: '', category: { id: '', name: '' } },
      chapterId: record.chapter_id,
      sectionId: record.section_id || undefined,
      chapterNumber: chapterMap.get(record.chapter_id),
      sectionNumber: record.section_id ? sectionMap.get(record.section_id) : undefined,
      questionNumber: record.question_number,
      result: record.result,
      round: record.round,
      answeredAt: record.answered_at,
    }));
  },

  async fetchActivity(days: number = 105): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const answersData = await studyRecordRepository.findActivityAttempts(days);

    // attemptsの中のansweredAtから日ごとに集計
    const countMap = new Map<string, number>();
    answersData.forEach((qa) => {
      ((qa.attempts as any[]) || []).forEach((attempt) => {
        if (attempt.answeredAt && attempt.resultConfirmFlg) {
          const dateStr = new Date(attempt.answeredAt).toISOString().split('T')[0];
          if (dateStr >= startDateStr) {
            countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
          }
        }
      });
    });

    return Array.from(countMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async addRecord(params: {
    userId: string;
    quizBookId: string;
    chapterId: string;
    questionNumber: number;
    result: '○' | '×';
    round: number;
    sectionId?: string;
  }): Promise<void> {
    await studyRecordRepository.insert(params);
    // Note: 10件制限は Phase 3 で DB trigger を追加予定。
    // trigger 追加前は backend が制限していたが、一時的に制限なしになる。
  },
};
