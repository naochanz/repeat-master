import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizBooksService } from './quiz-books.service';
import { CreateQuizBookDto } from './dto/create-quiz-book.dto';
import { UpdateQuizBookDto } from './dto/update-quiz-book.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Controller('quiz-books')
@UseGuards(JwtAuthGuard) // ✅ 認証が必要
export class QuizBooksController {
  constructor(private readonly quizBooksService: QuizBooksService) { }

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

  // ========== Chapter CRUD ==========

  @Post(':quizBookId/chapters')
  createChapter(
    @Param('quizBookId') quizBookId: string,
    @Body() createChapterDto: CreateChapterDto,
    @Request() req,
  ) {
    console.log('🎯 Controller - req.user:', req.user); // ✅ デバッグログ追加
    return this.quizBooksService.createChapter(quizBookId, createChapterDto, req.user.id);
  }

  @Patch(':quizBookId/chpaters/:chapterId')
  updateChapter(
    @Param('quizBookId') quizBookId: string,
    @Param('chapterId') chapterId: string,
    @Body() updateChapterDto: UpdateChapterDto,
    @Request() req,
  ) {
    return this.quizBooksService.updateChapter(quizBookId, chapterId, updateChapterDto, req.user.id);
  }

  @Delete(':quizBookId/chapters/:chapterId')
  removeChapter(
    @Param('quizBookId') quizBookId: string,
    @Param('chapterId') chapterId: string,
    @Request() req,
  ) {
    return this.quizBooksService.removeChapter(quizBookId, chapterId, req.user.id);
  }
  // ========== Section CRUD ==========

  @Post(':quizBookId/chapters/:chapterId/sections')
  createSection(
    @Param('quizBookId') quizBookId: string,
    @Param('chapterId') chapterId: string,
    @Body() createSectionDto: CreateSectionDto,
    @Request() req,
  ) {
    return this.quizBooksService.createSection(quizBookId, chapterId, createSectionDto, req.user.id);
  }

  @Patch(':quizBookId/chapters/:chapterId/sections/:sectionId')
  updateSection(
    @Param('quizBookId') quizBookId: string,
    @Param('chapterId') chapterId: string,
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @Request() req,
  ) {
    return this.quizBooksService.updateSection(quizBookId, chapterId, sectionId, updateSectionDto, req.user.id);
  }

  @Delete(':quizBookId/chapters/:chapterId/sections/:sectionId')
  removeSection(
    @Param('quizBookId') quizBookId: string,
    @Param('chapterId') chapterId: string,
    @Param('sectionId') sectionId: string,
    @Request() req,
  ) {
    return this.quizBooksService.removeSection(quizBookId, chapterId, sectionId, req.user.id);
  }

  // ========== QuestionAnswer CRUD ==========

  @Post(':quizBookId/answers')
  createAnswer(
    @Param('quizBookId') quizBookId: string,
    @Body() createAnswerDto: CreateAnswerDto,
    @Request() req,
  ) {
    return this.quizBooksService.createAnswer(quizBookId, createAnswerDto, req.user.id);
  }

  @Patch(':quizBookId/answers/:answerId')
  updateAnswer(
    @Param('quizBookId') quizBookId: string,
    @Param('answerId') answerId: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @Request() req,
  ) {
    return this.quizBooksService.updateAnswer(quizBookId, answerId, updateAnswerDto, req.user.id);
  }

  @Delete(':quizBookId/answers/:answerId')
  removeAnswer(
    @Param('quizBookId') quizBookId: string,
    @Param('answerId') answerId: string,
    @Request() req,
  ) {
    return this.quizBooksService.removeAnswer(quizBookId, answerId, req.user.id);
  }
}