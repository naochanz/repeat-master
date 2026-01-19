import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class UpdateAnswerDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  memo?: string;

  @IsBoolean()
  @IsOptional()
  isBookmarked?: boolean;
}
