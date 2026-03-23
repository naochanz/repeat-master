import { quizBookRepository } from '@/repositories/quizBookRepository';
import { QuizBook, Chapter, QuestionAnswer } from '@/types/QuizBook';

function calculateChapterRateForRound(chapter: Chapter, round: number): number {
  let totalQuestions = 0;
  let correctAnswers = 0;

  const processAnswers = (answers: QuestionAnswer[]) => {
    answers.forEach((qa) => {
      const roundAttempt = qa.attempts?.find((a) => a.round === round && a.resultConfirmFlg);
      if (roundAttempt) {
        totalQuestions++;
        if (roundAttempt.result === '○') {
          correctAnswers++;
        }
      }
    });
  };

  if (chapter.sections && chapter.sections.length > 0) {
    chapter.sections.forEach((section) => {
      if (section.questionAnswers) {
        processAnswers(section.questionAnswers);
      }
    });
  } else if (chapter.questionAnswers) {
    processAnswers(chapter.questionAnswers);
  }

  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

function sortAndCalculateRates(quizBook: QuizBook): QuizBook {
  const displayRound = (quizBook.currentRound || 0) + 1;

  quizBook.chapters = (quizBook.chapters || [])
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
    .map((chapter) => ({
      ...chapter,
      chapterRate: calculateChapterRateForRound(chapter, displayRound),
      sections: (chapter.sections || []).sort((a, b) => a.sectionNumber - b.sectionNumber),
    }));

  return quizBook;
}

export const quizBookDomain = {
  async fetchAll(): Promise<QuizBook[]> {
    const quizBooks = await quizBookRepository.findAll();
    return quizBooks.map(sortAndCalculateRates);
  },

  async fetchOne(id: string): Promise<QuizBook> {
    const quizBook = await quizBookRepository.findOne(id);
    return sortAndCalculateRates(quizBook);
  },

  async create(
    title: string,
    categoryId: string,
    useSections: boolean,
    isbn?: string,
    thumbnailUrl?: string,
  ): Promise<QuizBook> {
    return quizBookRepository.create({ title, categoryId, useSections, isbn, thumbnailUrl });
  },

  async update(id: string, updates: Record<string, any>): Promise<void> {
    await quizBookRepository.update(id, updates);
  },

  async remove(id: string): Promise<void> {
    await quizBookRepository.remove(id);
  },

  async complete(id: string): Promise<void> {
    await quizBookRepository.complete(id);
  },

  async reactivate(id: string): Promise<void> {
    await quizBookRepository.reactivate(id);
  },

  async countActive(): Promise<number> {
    return quizBookRepository.countActive();
  },

  calculateChapterRateForRound,
};
