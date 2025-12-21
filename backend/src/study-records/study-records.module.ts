import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyRecordsService } from './study-records.service';
import { StudyRecordsController } from './study-records.controller';
import { StudyRecord } from './entities/study-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudyRecord])],
  controllers: [StudyRecordsController],
  providers: [StudyRecordsService],
  exports: [StudyRecordsService],
})
export class StudyRecordsModule {}