import { IsString, IsOptional, IsNumber, MaxLength, Min, Max } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  sectionNumber: number;

  @IsNumber()
  @Min(0)
  @Max(10000)
  questionCount: number;
}
