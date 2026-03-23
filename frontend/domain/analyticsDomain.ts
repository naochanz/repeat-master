import { QuizBook, QuestionAnswer, Chapter } from '@/types/QuizBook';

interface RoundStats {
  round: number;
  totalQuestions: number;
  correctAnswers: number;
  correctRate: number;
}

interface ChapterStats {
  round: number;
  chapterId: string;
  chapterNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  correctRate: number;
}

interface SectionStats {
  round: number;
  sectionId: string;
  chapterId: string;
  sectionNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  correctRate: number;
}

export interface Analytics {
  quizBookId: string;
  totalRounds: number;
  roundStats: RoundStats[];
  chapterStats: ChapterStats[];
  sectionStats: SectionStats[];
}

function collectAllAnswers(chapters: Chapter[]): QuestionAnswer[] {
  const answers: QuestionAnswer[] = [];
  chapters.forEach((chapter) => {
    if (chapter.questionAnswers) {
      answers.push(...chapter.questionAnswers);
    }
    if (chapter.sections) {
      chapter.sections.forEach((section) => {
        if (section.questionAnswers) {
          answers.push(...section.questionAnswers);
        }
      });
    }
  });
  return answers;
}

function calculateTotalRounds(answers: QuestionAnswer[]): number {
  let maxRound = 0;
  answers.forEach((answer) => {
    answer.attempts.filter((a) => a.resultConfirmFlg).forEach((attempt) => {
      if (attempt.round > maxRound) maxRound = attempt.round;
    });
  });
  return maxRound;
}

function calculateRoundStats(answers: QuestionAnswer[], totalRounds: number): RoundStats[] {
  const stats: RoundStats[] = [];
  for (let round = 1; round <= totalRounds; round++) {
    let totalQuestions = 0;
    let correctAnswers = 0;
    answers.forEach((answer) => {
      const attempt = answer.attempts.find((a) => a.round === round && a.resultConfirmFlg);
      if (attempt) {
        totalQuestions++;
        if (attempt.result === '○') correctAnswers++;
      }
    });
    const correctRate = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10
      : 0;
    stats.push({ round, totalQuestions, correctAnswers, correctRate });
  }
  return stats;
}

function calculateChapterStats(answers: QuestionAnswer[], totalRounds: number, chapters: Chapter[]): ChapterStats[] {
  const stats: ChapterStats[] = [];
  const chapterMap = new Map(chapters.map((c) => [c.id, c]));

  const chapterGroups = new Map<string, QuestionAnswer[]>();
  answers.forEach((answer) => {
    if (answer.chapterId) {
      if (!chapterGroups.has(answer.chapterId)) chapterGroups.set(answer.chapterId, []);
      chapterGroups.get(answer.chapterId)!.push(answer);
    }
  });

  chapterGroups.forEach((chapterAnswers, chapterId) => {
    const chapter = chapterMap.get(chapterId);
    const chapterNumber = chapter?.chapterNumber || 0;
    for (let round = 1; round <= totalRounds; round++) {
      let totalQuestions = 0;
      let correctAnswers = 0;
      chapterAnswers.forEach((answer) => {
        const attempt = answer.attempts.find((a) => a.round === round && a.resultConfirmFlg);
        if (attempt) {
          totalQuestions++;
          if (attempt.result === '○') correctAnswers++;
        }
      });
      if (totalQuestions > 0) {
        const correctRate = Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10;
        stats.push({ round, chapterId, chapterNumber, totalQuestions, correctAnswers, correctRate });
      }
    }
  });

  return stats.sort((a, b) => a.round !== b.round ? a.round - b.round : a.chapterNumber - b.chapterNumber);
}

function calculateSectionStats(answers: QuestionAnswer[], totalRounds: number, chapters: Chapter[]): SectionStats[] {
  const stats: SectionStats[] = [];
  const sectionMap = new Map<string, { chapterId: string; sectionNumber: number }>();

  chapters.forEach((chapter) => {
    chapter.sections?.forEach((section) => {
      sectionMap.set(section.id, { chapterId: chapter.id, sectionNumber: section.sectionNumber });
    });
  });

  const sectionGroups = new Map<string, QuestionAnswer[]>();
  answers.forEach((answer) => {
    if (answer.sectionId) {
      if (!sectionGroups.has(answer.sectionId)) sectionGroups.set(answer.sectionId, []);
      sectionGroups.get(answer.sectionId)!.push(answer);
    }
  });

  sectionGroups.forEach((sectionAnswers, sectionId) => {
    const section = sectionMap.get(sectionId);
    const chapterId = section?.chapterId || '';
    const sectionNumber = section?.sectionNumber || 0;
    for (let round = 1; round <= totalRounds; round++) {
      let totalQuestions = 0;
      let correctAnswers = 0;
      sectionAnswers.forEach((answer) => {
        const attempt = answer.attempts.find((a) => a.round === round && a.resultConfirmFlg);
        if (attempt) {
          totalQuestions++;
          if (attempt.result === '○') correctAnswers++;
        }
      });
      if (totalQuestions > 0) {
        const correctRate = Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10;
        stats.push({ round, sectionId, chapterId, sectionNumber, totalQuestions, correctAnswers, correctRate });
      }
    }
  });

  return stats.sort((a, b) => a.round !== b.round ? a.round - b.round : a.sectionNumber - b.sectionNumber);
}

export const analyticsDomain = {
  computeFromQuizBook(quizBook: QuizBook): Analytics {
    const answers = collectAllAnswers(quizBook.chapters);
    const totalRounds = calculateTotalRounds(answers);
    return {
      quizBookId: quizBook.id,
      totalRounds,
      roundStats: calculateRoundStats(answers, totalRounds),
      chapterStats: calculateChapterStats(answers, totalRounds, quizBook.chapters),
      sectionStats: calculateSectionStats(answers, totalRounds, quizBook.chapters),
    };
  },
};
