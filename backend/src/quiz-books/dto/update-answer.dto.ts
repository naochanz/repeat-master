import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAnswerDto {
  @IsString()
  @IsOptional()
  memo?: string;

  @IsBoolean()
  @IsOptional()
  isBookmarked?: boolean;
}