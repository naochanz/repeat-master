import { IsString, IsOptional, IsNumber, MaxLength, Min, Max } from 'class-validator';

export class UpdateChapterDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  chapterNumber?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10000)
  questionCount?: number;
}
