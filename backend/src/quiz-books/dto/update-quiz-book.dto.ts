import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, MaxLength, Min, Max } from 'class-validator';

export class UpdateQuizBookDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  currentRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  currentRound?: number;

  @IsBoolean()
  @IsOptional()
  useSections?: boolean;
}
