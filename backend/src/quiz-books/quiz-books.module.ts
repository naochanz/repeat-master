import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport'; // ✅ 追加
import { QuizBooksService } from './quiz-books.service';
import { QuizBooksController } from './quiz-books.controller';
import { QuizBook } from './entities/quiz-book.entity';
import { Chapter } from './entities/chapter.entity';
import { Section } from './entities/section.entity';
import { QuestionAnswer } from './entities/question-answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizBook, Chapter, Section, QuestionAnswer]),
    PassportModule, // ✅ 追加
  ],
  controllers: [QuizBooksController],
  providers: [QuizBooksService],
  exports: [QuizBooksService],
})
export class QuizBooksModule {}