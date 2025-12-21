import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { StudyRecordsService } from './study-records.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('study-records')
@UseGuards(JwtAuthGuard)
export class StudyRecordsController {
    constructor(private readonly studyRecordsService: StudyRecordsService){}

    @Get('recent')
    async getRecent(@Request() req){
        return this.studyRecordsService.getRecentRecords(req.user.id);
    }
}