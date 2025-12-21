import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QuizBooksService } from './quiz-books.service';
import { QuizBooksController } from './quiz-books.controller';
import { QuizBook } from './entities/quiz-book.entity';
import { Chapter } from './entities/chapter.entity';
import { Section } from './entities/section.entity';
import { QuestionAnswer } from './entities/question-answer.entity';
import { StudyRecordsModule } from 'src/study-records/study-records.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizBook, Chapter, Section, QuestionAnswer]),
    AuthModule,
    StudyRecordsModule,
  ],
  controllers: [QuizBooksController],
  providers: [QuizBooksService],
  exports: [QuizBooksService],
})
export class QuizBooksModule {}