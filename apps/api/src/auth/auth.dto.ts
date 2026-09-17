import { IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @MinLength(10)
  idToken!: string;
}

export class AppleAuthDto {
  @IsString()
  @MinLength(10)
  identityToken!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
