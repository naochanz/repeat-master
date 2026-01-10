import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QuizBooksService } from './quiz-books.service';
import { QuizBooksController } from './quiz-books.controller';
import { StudyRecordsModule } from '../study-records/study-records.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule, AuthModule, StudyRecordsModule],
  controllers: [QuizBooksController],
  providers: [QuizBooksService],
  exports: [QuizBooksService],
})
export class QuizBooksModule {}
