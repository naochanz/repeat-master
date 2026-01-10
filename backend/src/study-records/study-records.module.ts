import { Module } from '@nestjs/common';
import { StudyRecordsService } from './study-records.service';
import { StudyRecordsController } from './study-records.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [StudyRecordsController],
  providers: [StudyRecordsService],
  exports: [StudyRecordsService],
})
export class StudyRecordsModule {}
