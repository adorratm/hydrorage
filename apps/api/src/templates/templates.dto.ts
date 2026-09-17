import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ProfanityLevel } from '@/database/enums';

export class CreateTemplateDto {
  @IsString()
  @MinLength(5)
  text!: string;

  @IsEnum(ProfanityLevel)
  profanityLevel!: ProfanityLevel;

  @IsOptional()
  @IsString()
  characterId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  text?: string;

  @IsOptional()
  @IsEnum(ProfanityLevel)
  profanityLevel?: ProfanityLevel;

  @IsOptional()
  @IsString()
  characterId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
