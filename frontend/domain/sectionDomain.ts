import { sectionRepository } from '@/repositories/sectionRepository';
import { Section } from '@/types/QuizBook';

export const sectionDomain = {
  async create(chapterId: string, sectionNumber: number, title?: string, questionCount?: number): Promise<Section> {
    return sectionRepository.create(chapterId, sectionNumber, title, questionCount);
  },

  async update(sectionId: string, updates: Record<string, any>): Promise<Section> {
    return sectionRepository.update(sectionId, updates);
  },

  async remove(sectionId: string): Promise<void> {
    await sectionRepository.remove(sectionId);
  },
};
