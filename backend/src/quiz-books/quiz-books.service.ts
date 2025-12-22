import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizBook } from './entities/quiz-book.entity';
import { Chapter } from './entities/chapter.entity';
import { Section } from './entities/section.entity';
import { QuestionAnswer } from './entities/question-answer.entity';
import { CreateQuizBookDto } from './dto/create-quiz-book.dto';
import { UpdateQuizBookDto } from './dto/update-quiz-book.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { SectionStatsDto, ChapterStatsDto, QuizBookAnalyticsDto, RoundStatsDto } from './dto/quiz-book-analytics';
import { StudyRecordsService } from 'src/study-records/study-records.service';

@Injectable()
export class QuizBooksService {
    constructor(
        @InjectRepository(QuizBook)
        private quizBookRepository: Repository<QuizBook>,
        @InjectRepository(Chapter)
        private chapterRepository: Repository<Chapter>,
        @InjectRepository(Section)
        private sectionRepository: Repository<Section>,
        @InjectRepository(QuestionAnswer)
        private questionAnswerRepository: Repository<QuestionAnswer>,
        private studyRecordsService: StudyRecordsService,
    ) { }

    // 全問題集を取得（ユーザーIDでフィルタ）
    async findAll(userId: string): Promise<QuizBook[]> {
        return this.quizBookRepository.find({
            where: { userId },
            relations: [
                'category',  // ✅ 追加
                'chapters',
                'chapters.sections',
                'chapters.questionAnswers',
                'chapters.sections.questionAnswers'
            ],
            order: {
                createdAt: 'DESC',
                chapters: {
                    chapterNumber: 'ASC',
                    sections: {
                        sectionNumber: 'ASC',
                    },
                },
            },
        });
    }

    //問題集を一件取得
    async findOne(id: string, userId: string): Promise<QuizBook> {
        const quizBook = await this.quizBookRepository.findOne({
            where: { id, userId },
            relations: ['category', 'chapters', 'chapters.sections', 'chapters.questionAnswers', 'chapters.sections.questionAnswers'],
        });

        if (!quizBook) {
            throw new NotFoundException('QuizBook not found');
        }

        return quizBook;
    };

    //問題集を作成
    async create(createQuizBookDto: CreateQuizBookDto, userId: string): Promise<QuizBook> {
        const quizBook = this.quizBookRepository.create({
            ...createQuizBookDto,
            userId,
            chapters: [],
        });

        return this.quizBookRepository.save(quizBook);
    }

    // 問題集を更新
    async update(id: string, updateQuizBookDto: UpdateQuizBookDto, userId: string): Promise<QuizBook> {
        const quizBook = await this.findOne(id, userId);

        Object.assign(quizBook, updateQuizBookDto);

        return this.quizBookRepository.save(quizBook);
    }

    //問題集を削除
    async remove(id: string, userId: string): Promise<void> {
        const quizBook = await this.findOne(id, userId);
        await this.quizBookRepository.remove(quizBook);
    }

    // ========== Chapter CRUD ==========

    // 章を追加
    async createChapter(quizBookId: string, createChapterDto: CreateChapterDto, userId: string): Promise<Chapter> {
        const quizBook = await this.findOne(quizBookId, userId);

        const chapter = this.chapterRepository.create({
            ...createChapterDto,
            quizBookId: quizBook.id,
        });

        const savedChapter = await this.chapterRepository.save(chapter);

        //問題集のchapterCountを更新
        return savedChapter;
    }

    //章を更新
    async updateChapter(quizBookId: string, chapterId: string, updateChapterDto: UpdateChapterDto, userId: string): Promise<Chapter> {
        await this.findOne(quizBookId, userId); // 権限チェック

        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId, quizBookId },
        });
        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }
        Object.assign(chapter, updateChapterDto);
        return this.chapterRepository.save(chapter);
    }

    //章を削除
    async removeChapter(quizBookId: string, chapterId: string, userId: string): Promise<void> {
        await this.findOne(quizBookId, userId)// 権限チェック

        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId, quizBookId },
        });

        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }

        await this.chapterRepository.remove(chapter);
    }

    // ========== Section CRUD ==========

    // 節を追加
    async createSection(quizBookId: string, chapterId: string, createSectionDto: CreateSectionDto, userId: string): Promise<Section> {
        await this.findOne(quizBookId, userId); // 権限チェック

        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId, quizBookId },
        });

        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }

        const section = this.sectionRepository.create({
            ...createSectionDto,
            chapterId: chapter.id,
        });

        return this.sectionRepository.save(section);
    }

    //節を更新
    async updateSection(quizBookId: string, chapterId: string, sectionId: string, updateSectionDto: UpdateSectionDto, userId: string): Promise<Section> {
        await this.findOne(quizBookId, userId);//権限チェック

        const section = await this.sectionRepository.findOne({
            where: { id: sectionId, chapterId },
        });

        if (!section) {
            throw new NotFoundException('Section not found');
        }
        Object.assign(section, updateSectionDto);
        return this.sectionRepository.save(section);
    }

    //節を削除
    async removeSection(quizBookId: string, chapterId: string, sectionId: string, userId: string): Promise<void> {
        await this.findOne(quizBookId, userId); //権限チェック

        const section = await this.sectionRepository.findOne({
            where: { id: sectionId, chapterId },
        });

        if (!section) {
            throw new NotFoundException('Section not found');
        }

        await this.sectionRepository.remove(section);
    }
    // ========== QuestionAnswer CRUD ==========

    // 回答を保存
    async createAnswer(quizBookId: string, createAnswerDto: CreateAnswerDto, userId: string): Promise<QuestionAnswer> {
        await this.findOne(quizBookId, userId); //権限チェック

        //既存の回答を取得
        const existingAnswer = await this.questionAnswerRepository.findOne({
            where: {
                questionNumber: createAnswerDto.questionNumber,
                ...(createAnswerDto.chapterId && { chapterId: createAnswerDto.chapterId }),
                ...(createAnswerDto.sectionId && { sectionId: createAnswerDto.sectionId }),
            },
        })

        if (existingAnswer) {
            //既存の回答に追加
            const newAttempt = {
                round: existingAnswer.attempts.length + 1,
                result: createAnswerDto.result,
                resultConfirmFlg: true,
                answeredAt: new Date(),
            };

            existingAnswer.attempts.push(newAttempt);
            const savedAnswer = await this.questionAnswerRepository.save(existingAnswer);

            if (createAnswerDto.chapterId) {
                await this.studyRecordsService.addStudyRecord(
                    userId,
                    quizBookId,
                    createAnswerDto.chapterId,  // ✅ ここで string であることが保証される
                    createAnswerDto.questionNumber,
                    createAnswerDto.result,
                    newAttempt.round,
                    createAnswerDto.sectionId,
                );
            }

            return savedAnswer;
        } else {
            // 新規作成
            const answer = this.questionAnswerRepository.create({
                questionNumber: createAnswerDto.questionNumber,
                chapterId: createAnswerDto.chapterId,
                sectionId: createAnswerDto.sectionId,
                attempts: [{
                    round: 1,
                    result: createAnswerDto.result,
                    resultConfirmFlg: true,
                    answeredAt: new Date(),
                }],
            });

            const savedAnswer = await this.questionAnswerRepository.save(answer);

            // ✅ StudyRecord を追加
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

            return savedAnswer;
        }
    }
    // メモを更新
    async updateAnswer(quizBookId: string, answerId: string, updateAnswerDto: UpdateAnswerDto, userId: string): Promise<QuestionAnswer> {
        await this.findOne(quizBookId, userId); // 権限チェック

        const answer = await this.questionAnswerRepository.findOne({
            where: { id: answerId },
        });

        if (!answer) {
            throw new NotFoundException('Answer not found');
        }

        Object.assign(answer, updateAnswerDto);
        return this.questionAnswerRepository.save(answer);
    }
    // 回答を削除（すべてのattempts）
    async removeAnswer(quizBookId: string, answerId: string, userId: string): Promise<void> {
        await this.findOne(quizBookId, userId); // 権限チェック

        const answer = await this.questionAnswerRepository.findOne({
            where: { id: answerId },
        });

        if (!answer) {
            throw new NotFoundException('Answer not found');
        }

        await this.questionAnswerRepository.remove(answer);
    }

    // 最新のattemptのみ削除
    async removeLatestAttempt(quizBookId: string, answerId: string, userId: string): Promise<void> {
        await this.findOne(quizBookId, userId); // 権限チェック

        const answer = await this.questionAnswerRepository.findOne({
            where: { id: answerId },
        });

        if (!answer) {
            throw new NotFoundException('Answer not found');
        }

        if (!answer.attempts || answer.attempts.length === 0) {
            throw new NotFoundException('No attempts found');
        }

        // attemptsから最後の要素を削除
        answer.attempts = answer.attempts.slice(0, -1);

        // attemptsが空になった場合は、QuestionAnswer自体を削除
        if (answer.attempts.length === 0) {
            await this.questionAnswerRepository.remove(answer);
        } else {
            await this.questionAnswerRepository.save(answer);
        }
    }

    async getAnalytics(quizBookId: string, userId: string): Promise<QuizBookAnalyticsDto> {
        //問題集の存在確認と権限チェック
        const quizBook = await this.findOne(quizBookId, userId);

        //全ての回答データを取得
        const answers = await this.questionAnswerRepository.find({
            where: [
                { chapter: { quizBookId } },
                { section: { chapter: { quizBookId } } }
            ],
            relations: ['chapter', 'section']
        });

        //周回数を集計
        const totalRounds = this.calculateTotalRounds(answers);

        //各種統計の計算
        const roundStats = this.calculateRoundStats(answers, totalRounds);  //周回ごとの正答率
        const chapterStats = this.calculateChapterStats(answers, totalRounds); //チャプターごとの正答率
        const sectionStats = this.calculateSectionStats(answers, totalRounds); //セクションごとの正答率

        return {
            quizBookId,
            totalRounds,
            roundStats,
            chapterStats,
            sectionStats,
        };
    }
    /**
    * 総周回数を計算（確定済み解答の最大round）
    */
    private calculateTotalRounds(answers: QuestionAnswer[]): number {
        let maxRound = 0;

        answers.forEach(answer => {
            const confirmedAttempts = answer.attempts.filter(a => a.resultConfirmFlg);
            confirmedAttempts.forEach(attempt => {
                if (attempt.round > maxRound) {
                    maxRound = attempt.round;
                }
            });
        });

        return maxRound;
    }

    /**
     * 周回ごとの正答率を計算
     */
    private calculateRoundStats(
        answers: QuestionAnswer[],
        totalRounds: number,
    ): RoundStatsDto[] {
        const stats: RoundStatsDto[] = [];

        for (let round = 1; round <= totalRounds; round++) {
            let totalQuestions = 0;
            let correctAnswers = 0;

            answers.forEach(answer => {
                const roundAttempt = answer.attempts.find(
                    a => a.round === round && a.resultConfirmFlg,
                );

                //確定済みの問題数と正解した問題数をそれぞれ加算
                if (roundAttempt) {
                    totalQuestions++;
                    if (roundAttempt.result === '○') {
                        correctAnswers++;
                    }
                }
            });

            //正答率計算
            const correctRate = totalQuestions > 0
                ? Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10
                : 0;

            //オブジェクトを配列に追加（周回の情報をstats配列に追加）
            stats.push({
                round,
                totalQuestions,
                correctAnswers,
                correctRate,
            });
        }

        return stats;
    }

    /**
     * 周回 × Chapter ごとの正答率を計算
     */
    private calculateChapterStats(
        answers: QuestionAnswer[],
        totalRounds: number,
    ): ChapterStatsDto[] {
        const stats: ChapterStatsDto[] = [];

        // Chapter IDごとにグループ化
        const chapterGroups = new Map<string, QuestionAnswer[]>();

        answers.forEach(answer => {
            if (answer.chapterId) {
                if (!chapterGroups.has(answer.chapterId)) {
                    chapterGroups.set(answer.chapterId, []);
                }
                chapterGroups.get(answer.chapterId)!.push(answer);
            }
        });

        //各chapter　×　各周回で集計
        chapterGroups.forEach((chapterAnswers, chapterId) => {
            const chapterNumber = chapterAnswers[0]?.chapter?.chapterNumber || 0;

            for (let round = 1; round <= totalRounds; round++) {
                let totalQuestions = 0;
                let correctAnswers = 0;

                chapterAnswers.forEach(answer => {
                    const roundAttempt = answer.attempts.find(
                        a => a.round === round && a.resultConfirmFlg,
                    );

                    if (roundAttempt) {
                        totalQuestions++;
                        if (roundAttempt.result === '○') {
                            correctAnswers++;
                        }
                    }
                });

                if (totalQuestions > 0) {
                    const correctRate = Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10;

                    stats.push({
                        round,
                        chapterId,
                        chapterNumber,
                        totalQuestions,
                        correctAnswers,
                        correctRate,
                    });
                }
            }
        });

        return stats.sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return a.chapterNumber - b.chapterNumber;
        });
    }
    /**
     * 周回 × Section ごとの正答率を計算
     */
    private calculateSectionStats(
        answers: QuestionAnswer[],
        totalRounds: number,
    ): SectionStatsDto[] {
        const stats: SectionStatsDto[] = [];

        // Section IDごとにグループ化
        const sectionGroups = new Map<string, QuestionAnswer[]>();

        answers.forEach(answer => {
            if (answer.sectionId) {
                if (!sectionGroups.has(answer.sectionId)) {
                    sectionGroups.set(answer.sectionId, []);
                }
                sectionGroups.get(answer.sectionId)!.push(answer);
            }
        });

        // 各Section × 各周回で集計
        sectionGroups.forEach((sectionAnswers, sectionId) => {
            const chapterId = sectionAnswers[0]?.chapterId || '';
            const sectionNumber = sectionAnswers[0]?.section?.sectionNumber || 0;

            for (let round = 1; round <= totalRounds; round++) {
                let totalQuestions = 0;
                let correctAnswers = 0;

                sectionAnswers.forEach(answer => {
                    const roundAttempt = answer.attempts.find(
                        a => a.round === round && a.resultConfirmFlg,
                    );

                    if (roundAttempt) {
                        totalQuestions++;
                        if (roundAttempt.result === '○') {
                            correctAnswers++;
                        }
                    }
                });

                if (totalQuestions > 0) {
                    const correctRate = Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10;

                    stats.push({
                        round,
                        sectionId,
                        chapterId,
                        sectionNumber,
                        totalQuestions,
                        correctAnswers,
                        correctRate,
                    });
                }
            }
        });

        return stats.sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return a.sectionNumber - b.sectionNumber;
        });
    }
}
