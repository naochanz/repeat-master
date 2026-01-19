import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserGoalDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  goal?: string;
}
