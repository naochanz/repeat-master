import { Test, TestingModule } from '@nestjs/testing';
import { QuizBooksService } from './quiz-books.service';

describe('QuizBooksService', () => {
  let service: QuizBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuizBooksService],
    }).compile();

    service = module.get<QuizBooksService>(QuizBooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
