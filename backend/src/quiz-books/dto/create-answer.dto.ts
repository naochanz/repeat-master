import { IsNumber, IsIn, IsUUID, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateAnswerDto {
  @IsNumber()
  @Min(1)
  @Max(10000)
  questionNumber: number;

  @IsIn(['○', '×'])
  result: '○' | '×';

  @IsUUID()
  @IsOptional()
  chapterId?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsBoolean()
  @IsOptional()
  isBookmarked?: boolean;
}
