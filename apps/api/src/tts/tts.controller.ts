import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { TtsService } from '@/tts/tts.service';

class TtsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}

@Controller('tts')
@UseGuards(JwtAuthGuard)
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  @Post()
  async speak(@Body() dto: TtsDto) {
    const audio = await this.tts.synthesizeTurkish(dto.text);
    return {
      mimeType: 'audio/mpeg',
      audioBase64: audio.toString('base64'),
    };
  }
}
