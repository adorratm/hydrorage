import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_CHARS = 500;
const CHUNK = 160;

@Injectable()
export class TtsService {
  constructor(private readonly config: ConfigService) {}

  async synthesizeTurkish(text: string): Promise<Buffer> {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) throw new BadRequestException('Metin boş');
    if (cleaned.length > MAX_CHARS) {
      throw new BadRequestException(`Metin en fazla ${MAX_CHARS} karakter`);
    }

    const apiKey =
      this.config.get<string>('GOOGLE_TTS_API_KEY') ||
      this.config.get<string>('GOOGLE_API_KEY');

    if (apiKey) {
      return this.googleCloudTts(cleaned, apiKey);
    }

    return this.translateTtsProxy(cleaned);
  }

  private async googleCloudTts(text: string, apiKey: string): Promise<Buffer> {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'tr-TR',
            name: 'tr-TR-Standard-A',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.05,
            pitch: -1.0,
          },
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Google TTS hata: ${err.slice(0, 200)}`);
    }
    const json = (await res.json()) as { audioContent?: string };
    if (!json.audioContent) {
      throw new BadRequestException('Google TTS ses dönmedi');
    }
    return Buffer.from(json.audioContent, 'base64');
  }

  /** Dev fallback — sunucu tarafı proxy (CORS yok), Türkçe */
  private async translateTtsProxy(text: string): Promise<Buffer> {
    const parts = splitChunks(text, CHUNK);
    const buffers: Buffer[] = [];

    for (const part of parts) {
      const url =
        'https://translate.google.com/translate_tts?' +
        new URLSearchParams({
          ie: 'UTF-8',
          client: 'tw-ob',
          tl: 'tr',
          q: part,
        }).toString();

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: '*/*',
          Referer: 'https://translate.google.com/',
        },
      });
      if (!res.ok) {
        throw new BadRequestException(
          `TTS proxy başarısız (${res.status}). GOOGLE_TTS_API_KEY ekle.`,
        );
      }
      buffers.push(Buffer.from(await res.arrayBuffer()));
    }

    return Buffer.concat(buffers);
  }
}

function splitChunks(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (rest.length <= max) {
      out.push(rest);
      break;
    }
    let cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.4) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  return out.filter(Boolean);
}
