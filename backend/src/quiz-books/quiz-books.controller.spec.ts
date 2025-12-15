import { Test, TestingModule } from '@nestjs/testing';
import { QuizBooksController } from './quiz-books.controller';

describe('QuizBooksController', () => {
  let controller: QuizBooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizBooksController],
    }).compile();

    controller = module.get<QuizBooksController>(QuizBooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
