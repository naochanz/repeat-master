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
     * 学習記録を追加（3件維持）
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

        //2.3件超えたら古いものを削除
        await this.keepLatestThree(userId);
    }

    /**
     * 最新3件のみ保持（古いものを削除）
     */
    private async keepLatestThree(userId: string): Promise<void> {
        //全レコードを取得してソート
        const allRecords = await this.studyRecordRepository.find({
            where: { userId },
            order: { answeredAt: 'DESC' },
        });

        //4件目以降を削除
        if (allRecords.length > 3) {
            const recordsToDelete = allRecords.slice(3);
            await this.studyRecordRepository.remove(recordsToDelete);
        }
    }

    /**
     * 最新3件を取得
     */
    async getRecentRecords(userId: string): Promise<StudyRecord[]> {
        return this.studyRecordRepository.find({
            where: { userId },
            relations: ['quizBook', 'quizBook.category'],
            order: { answeredAt: 'DESC' },
            take: 3,
        });
    }
}