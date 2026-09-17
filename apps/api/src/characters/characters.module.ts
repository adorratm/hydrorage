import { Module } from '@nestjs/common';
import { CharactersController } from '@/characters/characters.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CharactersController],
})
export class CharactersModule {}
