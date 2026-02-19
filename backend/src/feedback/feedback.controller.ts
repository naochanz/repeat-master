import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(@Request() req, @Body('message') message: string) {
    await this.feedbackService.create(req.user.id, message);
    return { success: true };
  }
}
