import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { QuizBooksModule } from './quiz-books/quiz-books.module';
import { QuizBook } from './quiz-books/entities/quiz-book.entity';
import { Chapter } from './quiz-books/entities/chapter.entity';
import { Section } from './quiz-books/entities/section.entity';
import { QuestionAnswer } from './quiz-books/entities/question-answer.entity';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { StudyRecordsModule } from './study-records/study-records.module'; 
import { StudyRecord } from './study-records/entities/study-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'repeat_master',
      entities: [User, Category, QuizBook, Chapter, Section, QuestionAnswer, StudyRecord],
      synchronize: true, // 本番環境ではfalseに
    }),
    AuthModule,
    UsersModule,
    StudyRecordsModule,
    QuizBooksModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}