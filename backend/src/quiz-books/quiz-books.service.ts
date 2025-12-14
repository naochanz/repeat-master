import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizBook } from './entities/quiz-book.entity';
import { Chapter } from './entities/chapter.entity';
import { Section } from './entities/section.entity';
import { QuestionAnswer } from './entities/question-answer.entity';
import { CreateQuizBookDto } from './dto/create-quiz-book.dto';
import { UpdateQuizBookDto } from './dto/update-quiz-book.dto';

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
    ) { }

    // 全問題集を取得（ユーザーIDでフィルタ）
    async findAll(userId: string): Promise<QuizBook[]> {
        return this.quizBookRepository.find({
            where: { userId },
            relations: ['chapters', 'chapters.sections', 'chapters.questionAnswers', 'chapters.sections.questionAnswers'],
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
            relations: ['chapters', 'chapters.sections', 'chapters.questionAnswers', 'chapters.sections.questionAnswers'],
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
}
