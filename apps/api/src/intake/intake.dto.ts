import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DrinkType } from '@/database/enums';

export class CreateIntakeDto {
  @IsEnum(DrinkType)
  type!: DrinkType;

  @IsString()
  label!: string;

  @IsInt()
  @Min(1)
  amountMl!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
