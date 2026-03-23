import { answerRepository } from '@/repositories/answerRepository';
import { studyRecordDomain } from '@/domain/studyRecordDomain';
import { supabase } from '@/lib/supabase';
import { Attempt } from '@/types/QuizBook';

export const answerDomain = {
  async createAnswer(
    quizBookId: string,
    questionNumber: number,
    result: '○' | '×',
    chapterId?: string,
    sectionId?: string,
  ): Promise<void> {
    const existing = await answerRepository.findByQuestion(questionNumber, chapterId, sectionId);

    let round: number;

    if (existing) {
      const newAttempt: Attempt = {
        round: existing.attempts.length + 1,
        result,
        resultConfirmFlg: true,
        answeredAt: new Date().toISOString(),
      };
      round = newAttempt.round;
      existing.attempts.push(newAttempt);
      await answerRepository.updateAttempts(existing.id, existing.attempts);
    } else {
      const newAttempt: Attempt = {
        round: 1,
        result,
        resultConfirmFlg: true,
        answeredAt: new Date().toISOString(),
      };
      round = 1;
      await answerRepository.create({
        questionNumber,
        chapterId,
        sectionId,
        attempts: [newAttempt],
      });
    }

    // StudyRecord 追加
    if (chapterId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await studyRecordDomain.addRecord({
          userId: user.id,
          quizBookId,
          chapterId,
          questionNumber,
          result,
          round,
          sectionId,
        });
      }
    }
  },

  async updateMemo(answerId: string, memo: string): Promise<void> {
    await answerRepository.updateMemo(answerId, memo);
  },

  async updateBookmark(answerId: string, isBookmarked: boolean): Promise<void> {
    await answerRepository.updateBookmark(answerId, isBookmarked);
  },

  async deleteAnswer(answerId: string): Promise<void> {
    await answerRepository.remove(answerId);
  },

  async deleteLatestAttempt(answerId: string): Promise<void> {
    const answer = await answerRepository.findById(answerId);
    if (!answer) throw new Error('回答が見つかりません');

    answer.attempts.pop();

    if (answer.attempts.length === 0) {
      await answerRepository.remove(answerId);
    } else {
      await answerRepository.updateAttempts(answerId, answer.attempts);
    }
  },
};
