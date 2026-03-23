import { QuizBook, Chapter, Section, QuestionAnswer, RecentStudyItem } from '@/types/QuizBook';

function getLastConfirmedAnswer(questionAnswers?: QuestionAnswer[]): { questionNumber: number; result: '○' | '×'; answeredAt: string } | null {
  if (!questionAnswers || questionAnswers.length === 0) return null;
  let lastAnswer: { questionNumber: number; result: '○' | '×'; answeredAt: string } | null = null;
  questionAnswers.forEach(qa => {
    const confirmedAttempts = qa.attempts.filter(a => a.resultConfirmFlg);
    if (confirmedAttempts.length > 0) {
      const latest = confirmedAttempts[confirmedAttempts.length - 1];
      if (!lastAnswer || new Date(latest.answeredAt).getTime() > new Date(lastAnswer.answeredAt).getTime()) {
        lastAnswer = { questionNumber: qa.questionNumber, result: latest.result, answeredAt: latest.answeredAt };
      }
    }
  });
  return lastAnswer;
}

export const createSearchActions = (set: any, get: any) => ({
  getChapterById: (chapterId: string) => {
    for (const book of get().quizBooks) {
      const chapter = book.chapters.find((ch: Chapter) => ch.id === chapterId);
      if (chapter) return { book, chapter };
    }
    return undefined;
  },

  getSectionById: (sectionId: string) => {
    for (const book of get().quizBooks) {
      for (const chapter of book.chapters) {
        const section = chapter.sections?.find((sec: Section) => sec.id === sectionId);
        if (section) return { book, chapter, section };
      }
    }
    return undefined;
  },

  getRecentStudyItems: (): RecentStudyItem[] => {
    const { quizBooks } = get();
    const recentItems: RecentStudyItem[] = [];

    quizBooks.forEach((book: QuizBook) => {
      book.chapters.forEach((chapter: Chapter) => {
        if (book.useSections && chapter.sections) {
          chapter.sections.forEach((section: Section) => {
            const lastAnswer = getLastConfirmedAnswer(section.questionAnswers);
            if (lastAnswer) {
              recentItems.push({
                type: 'section', bookId: book.id, bookTitle: book.title, category: book.category?.name || '',
                chapterId: chapter.id, chapterNumber: chapter.chapterNumber, chapterTitle: chapter.title || '',
                sectionId: section.id, sectionNumber: section.sectionNumber, sectionTitle: section.title || '',
                lastAnsweredAt: lastAnswer.answeredAt, lastQuestionNumber: lastAnswer.questionNumber, lastResult: lastAnswer.result,
              });
            }
          });
        } else {
          const lastAnswer = getLastConfirmedAnswer(chapter.questionAnswers);
          if (lastAnswer) {
            recentItems.push({
              type: 'chapter', bookId: book.id, bookTitle: book.title, category: book.category?.name || '',
              chapterId: chapter.id, chapterNumber: chapter.chapterNumber, chapterTitle: chapter.title || '',
              lastAnsweredAt: new Date(lastAnswer.answeredAt), lastQuestionNumber: lastAnswer.questionNumber, lastResult: lastAnswer.result,
            });
          }
        }
      });
    });

    return recentItems.sort((a, b) => new Date(b.lastAnsweredAt).getTime() - new Date(a.lastAnsweredAt).getTime()).slice(0, 3);
  },
});
