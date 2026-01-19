import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID, MaxLength, IsUrl } from 'class-validator';

export class CreateQuizBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsBoolean()
  useSections: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  isbn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  thumbnailUrl?: string;
}
