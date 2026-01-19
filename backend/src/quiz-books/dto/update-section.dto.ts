import { IsString, IsOptional, IsNumber, MaxLength, Min, Max } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  sectionNumber?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10000)
  questionCount?: number;
}
