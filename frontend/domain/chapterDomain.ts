import { chapterRepository } from '@/repositories/chapterRepository';
import { Chapter } from '@/types/QuizBook';

export const chapterDomain = {
  async create(quizBookId: string, chapterNumber: number, title?: string, questionCount?: number): Promise<Chapter> {
    return chapterRepository.create(quizBookId, chapterNumber, title, questionCount);
  },

  async update(chapterId: string, updates: Record<string, any>): Promise<Chapter> {
    return chapterRepository.update(chapterId, updates);
  },

  async remove(chapterId: string): Promise<void> {
    await chapterRepository.remove(chapterId);
  },
};
