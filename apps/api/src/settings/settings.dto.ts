import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProfanityLevel } from '@/database/enums';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  voiceNotifications?: boolean;

  @IsOptional()
  @IsEnum(ProfanityLevel)
  profanityLevel?: ProfanityLevel;

  @IsOptional()
  @IsString()
  activeCharacterId?: string;

  @IsOptional()
  @IsBoolean()
  officeMute?: boolean;

  @IsOptional()
  @IsBoolean()
  nightMode?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  nightStartHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  nightEndHour?: number;

  @IsOptional()
  @IsBoolean()
  remindWater?: boolean;

  @IsOptional()
  @IsBoolean()
  remindCaffeine?: boolean;

  @IsOptional()
  @IsBoolean()
  remindMedicine?: boolean;

  @IsOptional()
  @IsBoolean()
  remindElectrolyte?: boolean;

  @IsOptional()
  @IsBoolean()
  remindWalk?: boolean;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  waterIntervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  publicShameProtection?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  whisperVolume?: number;
}
