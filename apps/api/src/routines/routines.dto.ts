import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  DrinkType,
  PunishmentIntensity,
  RoutineKind,
} from '@/database/enums';

export class CreateRoutineDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DrinkType)
  drinkType!: DrinkType;

  @IsInt()
  @Min(1)
  amountMl!: number;

  @IsEnum(RoutineKind)
  kind!: RoutineKind;

  @IsOptional()
  @IsInt()
  @Min(15)
  intervalMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificTimes?: string[];

  @IsEnum(PunishmentIntensity)
  intensity!: PunishmentIntensity;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DrinkType)
  drinkType?: DrinkType;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountMl?: number;

  @IsOptional()
  @IsEnum(RoutineKind)
  kind?: RoutineKind;

  @IsOptional()
  @IsInt()
  intervalMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificTimes?: string[];

  @IsOptional()
  @IsEnum(PunishmentIntensity)
  intensity?: PunishmentIntensity;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
