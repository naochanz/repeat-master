import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { StudyRecordsService } from '../study-records/study-records.service';
import { CreateQuizBookDto } from './dto/create-quiz-book.dto';
import { UpdateQuizBookDto } from './dto/update-quiz-book.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { SectionStatsDto, ChapterStatsDto, QuizBookAnalyticsDto, RoundStatsDto } from './dto/quiz-book-analytics';

export interface Attempt {
  round: number;
  result: '○' | '×';
  resultConfirmFlg: boolean;
  answeredAt: string;
}

export interface QuestionAnswer {
  id: string;
  questionNumber: number;
  chapterId: string | null;
  sectionId: string | null;
  memo: string | null;
  isBookmarked: boolean;
  attempts: Attempt[];
}

export interface Section {
  id: string;
  chapterId: string;
  sectionNumber: number;
  title: string | null;
  questionCount: number;
  questionAnswers?: QuestionAnswer[];
}

export interface Chapter {
  id: string;
  quizBookId: string;
  chapterNumber: number;
  title: string | null;
  chapterRate: number;
  questionCount: number | null;
  sections?: Section[];
  questionAnswers?: QuestionAnswer[];
}

export interface QuizBook {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  chapterCount: number;
  currentRate: number;
  useSections: boolean;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
  chapters: Chapter[];
}

@Injectable()
export class QuizBooksService {
  constructor(
    private supabaseService: SupabaseService,
    private studyRecordsService: StudyRecordsService,
  ) {}

  async findAll(userId: string): Promise<QuizBook[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('quiz_books')
      .select(`
        *,
        category:categories(*),
        chapters(
          *,
          sections(*, question_answers:question_answers(*)),
          question_answers:question_answers(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const quizBooks: QuizBook[] = (data || []).map((item: any) => this.mapToQuizBook(item));

    // 各章の正答率を計算（現在取り組み中の周回 = currentRound + 1）
    quizBooks.forEach((quizBook) => {
      const displayRound = (quizBook.currentRound || 0) + 1;
      quizBook.chapters.forEach((chapter) => {
        chapter.chapterRate = this.calculateChapterRateForRound(chapter, displayRound);
      });
    });

    return quizBooks;
  }

  async findOne(id: string, userId: string): Promise<QuizBook> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('quiz_books')
      .select(`
        *,
        category:categories(*),
        chapters(
          *,
          sections(*, question_answers:question_answers(*)),
          question_answers:question_answers(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('QuizBook not found');
    }

    const quizBook = this.mapToQuizBook(data);

    // 各章の正答率を計算（現在取り組み中の周回 = currentRound + 1）
    const displayRound = (quizBook.currentRound || 0) + 1;
    quizBook.chapters.forEach((chapter) => {
      chapter.chapterRate = this.calculateChapterRateForRound(chapter, displayRound);
    });

    return quizBook;
  }

  async create(createQuizBookDto: CreateQuizBookDto, userId: string): Promise<QuizBook> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('quiz_books')
      .insert({
        title: createQuizBookDto.title,
        category_id: createQuizBookDto.categoryId,
        use_sections: createQuizBookDto.useSections,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...this.mapToQuizBook(data), chapters: [] };
  }

  async update(id: string, updateQuizBookDto: UpdateQuizBookDto, userId: string): Promise<QuizBook> {
    await this.findOne(id, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const updateData: any = {};

    if (updateQuizBookDto.title !== undefined) updateData.title = updateQuizBookDto.title;
    if (updateQuizBookDto.categoryId !== undefined) updateData.category_id = updateQuizBookDto.categoryId;
    if (updateQuizBookDto.useSections !== undefined) updateData.use_sections = updateQuizBookDto.useSections;
    if (updateQuizBookDto.currentRound !== undefined) updateData.current_round = updateQuizBookDto.currentRound;

    const { data, error } = await supabase
      .from('quiz_books')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('quiz_books').delete().eq('id', id);
    if (error) throw error;
  }

  // ========== Chapter CRUD ==========

  async createChapter(quizBookId: string, createChapterDto: CreateChapterDto, userId: string): Promise<Chapter> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        quiz_book_id: quizBookId,
        chapter_number: createChapterDto.chapterNumber,
        title: createChapterDto.title,
        question_count: createChapterDto.questionCount,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToChapter(data);
  }

  async updateChapter(quizBookId: string, chapterId: string, updateChapterDto: UpdateChapterDto, userId: string): Promise<Chapter> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const updateData: any = {};

    if (updateChapterDto.chapterNumber !== undefined) updateData.chapter_number = updateChapterDto.chapterNumber;
    if (updateChapterDto.title !== undefined) updateData.title = updateChapterDto.title;
    if (updateChapterDto.questionCount !== undefined) updateData.question_count = updateChapterDto.questionCount;

    const { data, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', chapterId)
      .eq('quiz_book_id', quizBookId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Chapter not found');
    }
    return this.mapToChapter(data);
  }

  async removeChapter(quizBookId: string, chapterId: string, userId: string): Promise<void> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId)
      .eq('quiz_book_id', quizBookId);

    if (error) throw error;
  }

  // ========== Section CRUD ==========

  async createSection(quizBookId: string, chapterId: string, createSectionDto: CreateSectionDto, userId: string): Promise<Section> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('sections')
      .insert({
        chapter_id: chapterId,
        section_number: createSectionDto.sectionNumber,
        title: createSectionDto.title,
        question_count: createSectionDto.questionCount || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToSection(data);
  }

  async updateSection(quizBookId: string, chapterId: string, sectionId: string, updateSectionDto: UpdateSectionDto, userId: string): Promise<Section> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const updateData: any = {};

    if (updateSectionDto.sectionNumber !== undefined) updateData.section_number = updateSectionDto.sectionNumber;
    if (updateSectionDto.title !== undefined) updateData.title = updateSectionDto.title;
    if (updateSectionDto.questionCount !== undefined) updateData.question_count = updateSectionDto.questionCount;

    const { data, error } = await supabase
      .from('sections')
      .update(updateData)
      .eq('id', sectionId)
      .eq('chapter_id', chapterId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Section not found');
    }
    return this.mapToSection(data);
  }

  async removeSection(quizBookId: string, chapterId: string, sectionId: string, userId: string): Promise<void> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)
      .eq('chapter_id', chapterId);

    if (error) throw error;
  }

  // ========== QuestionAnswer CRUD ==========

  async createAnswer(quizBookId: string, createAnswerDto: CreateAnswerDto, userId: string): Promise<QuestionAnswer> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();

    // 既存の回答を取得
    let query = supabase
      .from('question_answers')
      .select('*')
      .eq('question_number', createAnswerDto.questionNumber);

    if (createAnswerDto.sectionId) {
      query = query.eq('section_id', createAnswerDto.sectionId);
    } else if (createAnswerDto.chapterId) {
      query = query.eq('chapter_id', createAnswerDto.chapterId);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      const attempts = existing.attempts as Attempt[];
      const newAttempt: Attempt = {
        round: attempts.length + 1,
        result: createAnswerDto.result,
        resultConfirmFlg: true,
        answeredAt: new Date().toISOString(),
      };

      attempts.push(newAttempt);

      const { data, error } = await supabase
        .from('question_answers')
        .update({ attempts })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      // StudyRecord追加
      if (createAnswerDto.chapterId) {
        await this.studyRecordsService.addStudyRecord(
          userId,
          quizBookId,
          createAnswerDto.chapterId,
          createAnswerDto.questionNumber,
          createAnswerDto.result,
          newAttempt.round,
          createAnswerDto.sectionId,
        );
      }

      return this.mapToQuestionAnswer(data);
    } else {
      const newAttempt: Attempt = {
        round: 1,
        result: createAnswerDto.result,
        resultConfirmFlg: true,
        answeredAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('question_answers')
        .insert({
          question_number: createAnswerDto.questionNumber,
          chapter_id: createAnswerDto.chapterId,
          section_id: createAnswerDto.sectionId,
          attempts: [newAttempt],
        })
        .select()
        .single();

      if (error) throw error;

      // StudyRecord追加
      if (createAnswerDto.chapterId) {
        await this.studyRecordsService.addStudyRecord(
          userId,
          quizBookId,
          createAnswerDto.chapterId,
          createAnswerDto.questionNumber,
          createAnswerDto.result,
          1,
          createAnswerDto.sectionId,
        );
      }

      return this.mapToQuestionAnswer(data);
    }
  }

  async updateAnswer(quizBookId: string, answerId: string, updateAnswerDto: UpdateAnswerDto, userId: string): Promise<QuestionAnswer> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const updateData: any = {};

    if (updateAnswerDto.memo !== undefined) updateData.memo = updateAnswerDto.memo;
    if (updateAnswerDto.isBookmarked !== undefined) updateData.is_bookmarked = updateAnswerDto.isBookmarked;

    const { data, error } = await supabase
      .from('question_answers')
      .update(updateData)
      .eq('id', answerId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Answer not found');
    }
    return this.mapToQuestionAnswer(data);
  }

  async removeAnswer(quizBookId: string, answerId: string, userId: string): Promise<void> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('question_answers')
      .delete()
      .eq('id', answerId);

    if (error) throw error;
  }

  async removeLatestAttempt(quizBookId: string, answerId: string, userId: string): Promise<void> {
    await this.findOne(quizBookId, userId); // 権限チェック

    const supabase = this.supabaseService.getClient();

    const { data: answer } = await supabase
      .from('question_answers')
      .select('*')
      .eq('id', answerId)
      .single();

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    const attempts = answer.attempts as Attempt[];
    if (attempts.length === 0) {
      throw new NotFoundException('No attempts found');
    }

    attempts.pop();

    if (attempts.length === 0) {
      await supabase.from('question_answers').delete().eq('id', answerId);
    } else {
      await supabase
        .from('question_answers')
        .update({ attempts })
        .eq('id', answerId);
    }
  }

  // ========== Analytics ==========

  async getAnalytics(quizBookId: string, userId: string): Promise<QuizBookAnalyticsDto> {
    const quizBook = await this.findOne(quizBookId, userId);

    // 全回答データを収集
    const answers: QuestionAnswer[] = [];
    quizBook.chapters.forEach((chapter) => {
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

    const totalRounds = this.calculateTotalRounds(answers);
    const roundStats = this.calculateRoundStats(answers, totalRounds);
    const chapterStats = this.calculateChapterStats(answers, totalRounds, quizBook.chapters);
    const sectionStats = this.calculateSectionStats(answers, totalRounds, quizBook.chapters);

    return {
      quizBookId,
      totalRounds,
      roundStats,
      chapterStats,
      sectionStats,
    };
  }

  // ========== Private Helper Methods ==========

  private calculateChapterRateForRound(chapter: Chapter, round: number): number {
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

  private calculateTotalRounds(answers: QuestionAnswer[]): number {
    let maxRound = 0;
    answers.forEach((answer) => {
      const confirmedAttempts = answer.attempts.filter((a) => a.resultConfirmFlg);
      confirmedAttempts.forEach((attempt) => {
        if (attempt.round > maxRound) {
          maxRound = attempt.round;
        }
      });
    });
    return maxRound;
  }

  private calculateRoundStats(answers: QuestionAnswer[], totalRounds: number): RoundStatsDto[] {
    const stats: RoundStatsDto[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      let totalQuestions = 0;
      let correctAnswers = 0;

      answers.forEach((answer) => {
        const roundAttempt = answer.attempts.find((a) => a.round === round && a.resultConfirmFlg);
        if (roundAttempt) {
          totalQuestions++;
          if (roundAttempt.result === '○') {
            correctAnswers++;
          }
        }
      });

      const correctRate = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10
        : 0;

      stats.push({ round, totalQuestions, correctAnswers, correctRate });
    }

    return stats;
  }

  private calculateChapterStats(answers: QuestionAnswer[], totalRounds: number, chapters: Chapter[]): ChapterStatsDto[] {
    const stats: ChapterStatsDto[] = [];
    const chapterMap = new Map(chapters.map((c) => [c.id, c]));

    const chapterGroups = new Map<string, QuestionAnswer[]>();
    answers.forEach((answer) => {
      if (answer.chapterId) {
        if (!chapterGroups.has(answer.chapterId)) {
          chapterGroups.set(answer.chapterId, []);
        }
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
          const roundAttempt = answer.attempts.find((a) => a.round === round && a.resultConfirmFlg);
          if (roundAttempt) {
            totalQuestions++;
            if (roundAttempt.result === '○') {
              correctAnswers++;
            }
          }
        });

        if (totalQuestions > 0) {
          const correctRate = Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10;
          stats.push({ round, chapterId, chapterNumber, totalQuestions, correctAnswers, correctRate });
        }
      }
    });

    return stats.sort((a, b) => (a.round !== b.round ? a.round - b.round : a.chapterNumber - b.chapterNumber));
  }

  private calculateSectionStats(answers: QuestionAnswer[], totalRounds: number, chapters: Chapter[]): SectionStatsDto[] {
    const stats: SectionStatsDto[] = [];
    const sectionMap = new Map<string, Section>();

    chapters.forEach((chapter) => {
      chapter.sections?.forEach((section) => {
        sectionMap.set(section.id, section);
      });
    });

    const sectionGroups = new Map<string, QuestionAnswer[]>();
    answers.forEach((answer) => {
      if (answer.sectionId) {
        if (!sectionGroups.has(answer.sectionId)) {
          sectionGroups.set(answer.sectionId, []);
        }
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
          const roundAttempt = answer.attempts.find((a) => a.round === round && a.resultConfirmFlg);
          if (roundAttempt) {
            totalQuestions++;
            if (roundAttempt.result === '○') {
              correctAnswers++;
            }
          }
        });

        if (totalQuestions > 0) {
          const correctRate = Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10;
          stats.push({ round, sectionId, chapterId, sectionNumber, totalQuestions, correctAnswers, correctRate });
        }
      }
    });

    return stats.sort((a, b) => (a.round !== b.round ? a.round - b.round : a.sectionNumber - b.sectionNumber));
  }

  // ========== Mappers ==========

  private mapToQuizBook(data: any): QuizBook {
    return {
      id: data.id,
      userId: data.user_id,
      categoryId: data.category_id,
      title: data.title,
      chapterCount: data.chapter_count,
      currentRate: data.current_rate,
      useSections: data.use_sections,
      currentRound: data.current_round,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      category: data.category ? { id: data.category.id, name: data.category.name } : undefined,
      chapters: (data.chapters || []).map((c: any) => this.mapToChapter(c)),
    };
  }

  private mapToChapter(data: any): Chapter {
    return {
      id: data.id,
      quizBookId: data.quiz_book_id,
      chapterNumber: data.chapter_number,
      title: data.title,
      chapterRate: data.chapter_rate || 0,
      questionCount: data.question_count,
      sections: (data.sections || []).map((s: any) => this.mapToSection(s)),
      questionAnswers: (data.question_answers || []).map((qa: any) => this.mapToQuestionAnswer(qa)),
    };
  }

  private mapToSection(data: any): Section {
    return {
      id: data.id,
      chapterId: data.chapter_id,
      sectionNumber: data.section_number,
      title: data.title,
      questionCount: data.question_count,
      questionAnswers: (data.question_answers || []).map((qa: any) => this.mapToQuestionAnswer(qa)),
    };
  }

  private mapToQuestionAnswer(data: any): QuestionAnswer {
    return {
      id: data.id,
      questionNumber: data.question_number,
      chapterId: data.chapter_id,
      sectionId: data.section_id,
      memo: data.memo,
      isBookmarked: data.is_bookmarked,
      attempts: data.attempts || [],
    };
  }
}
