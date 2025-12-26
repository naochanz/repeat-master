import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyRecord } from './entities/study-record.entity';

@Injectable()
export class StudyRecordsService {
    constructor(
        @InjectRepository(StudyRecord)
        private studyRecordRepository: Repository<StudyRecord>,
    ) { }

    /**
     * 学習記録を追加（問題集ごとに最新10件を維持）
     */

    async addStudyRecord(
        userId: string,
        quizBookId: string,
        chapterId: string,
        questionNumber: number,
        result: '○' | '×',
        round: number,
        sectionId?: string,
    ): Promise<void> {
        //1.新しいレコードを作成
        await this.studyRecordRepository.save({
            userId,
            quizBookId,
            chapterId,
            sectionId,
            questionNumber,
            result,
            round,
            answeredAt: new Date(),
        });

        //2.問題集ごとに最新10件のみ保持
        await this.keepLatestPerQuizBook(userId, quizBookId, 10);
    }

    /**
     * 問題集ごとに最新N件のみ保持（古いものを削除）
     */
    private async keepLatestPerQuizBook(userId: string, quizBookId: string, keepCount: number = 10): Promise<void> {
        //該当する問題集のレコードを取得してソート
        const allRecords = await this.studyRecordRepository.find({
            where: { userId, quizBookId },
            order: { answeredAt: 'DESC' },
        });

        //keepCount件目以降を削除
        if (allRecords.length > keepCount) {
            const recordsToDelete = allRecords.slice(keepCount);
            await this.studyRecordRepository.remove(recordsToDelete);
        }
    }

    /**
     * 問題集ごとに最新1件ずつ取得（最大10問題集分）
     */
    async getRecentRecords(userId: string): Promise<StudyRecord[]> {
        // PostgreSQLのDISTINCT ONを使用して、問題集ごとに最新のレコードを取得
        const records = await this.studyRecordRepository
            .createQueryBuilder('sr')
            .leftJoinAndSelect('sr.quizBook', 'quizBook')
            .leftJoinAndSelect('quizBook.category', 'category')
            .where('sr.userId = :userId', { userId })
            .orderBy('sr.quizBookId', 'ASC')
            .addOrderBy('sr.answeredAt', 'DESC')
            .distinctOn(['sr.quizBookId'])
            .getMany();

        // 日時順にソート
        return records.sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime()).slice(0, 10);
    }
}