import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizBooksService } from './quiz-books.service';
import { CreateQuizBookDto } from './dto/create-quiz-book.dto';
import { UpdateQuizBookDto } from './dto/update-quiz-book.dto';

@Controller('quiz-books')
@UseGuards(JwtAuthGuard) // ✅ 認証が必要
export class QuizBooksController {
  constructor(private readonly quizBooksService: QuizBooksService) {}

  @Get()
  findAll(@Request() req) {
    return this.quizBooksService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.quizBooksService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() createQuizBookDto: CreateQuizBookDto, @Request() req) {
    console.log('📨 POST /quiz-books called');
    console.log('🔑 Authorization header:', req.headers.authorization);
    console.log('👤 User from request:', req.user);
    return this.quizBooksService.create(createQuizBookDto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuizBookDto: UpdateQuizBookDto,
    @Request() req,
  ) {
    return this.quizBooksService.update(id, updateQuizBookDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.quizBooksService.remove(id, req.user.id);
  }
}