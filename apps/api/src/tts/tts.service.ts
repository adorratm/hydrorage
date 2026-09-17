import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Communicate } from 'edge-tts-universal';

const MAX_CHARS = 500;
const CHUNK = 160;

type YellMode = 'yell' | 'bark' | 'growl' | 'scold' | 'cold';

type VoiceProfile = {
  edgeVoice: string;
  rate: string;
  pitch: string;
  volume: string;
  yell: YellMode;
  googleName: string;
  googleRate: number;
  googlePitch: number;
};

/**
 * Bağırma hissi = volume (pitch yükseltmek sesi inceltiyor).
 * Pitch ≈ 0; rate hafif.
 */
const VOICE_BY_SLUG: Record<string, VoiceProfile> = {
  'ofkeli-mahalle-abisi': {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '+4%',
    pitch: '+0Hz',
    volume: '+100%',
    yell: 'yell',
    googleName: 'tr-TR-Standard-B',
    googleRate: 1.05,
    googlePitch: 0,
  },
  'agresif-fitness-kocu': {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '+8%',
    pitch: '-2Hz',
    volume: '+100%',
    yell: 'bark',
    googleName: 'tr-TR-Standard-D',
    googleRate: 1.08,
    googlePitch: -1,
  },
  'sinirli-balkan-annesi': {
    edgeVoice: 'tr-TR-EmelNeural',
    rate: '+3%',
    pitch: '+1Hz',
    volume: '+90%',
    yell: 'scold',
    googleName: 'tr-TR-Standard-A',
    googleRate: 1.04,
    googlePitch: 1,
  },
  'toksik-kurumsal-yonetici': {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '-2%',
    pitch: '+0Hz',
    volume: '+40%',
    yell: 'cold',
    googleName: 'tr-TR-Standard-C',
    googleRate: 0.98,
    googlePitch: 0,
  },
  dracula: {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '-5%',
    pitch: '-6Hz',
    volume: '+70%',
    yell: 'growl',
    googleName: 'tr-TR-Standard-B',
    googleRate: 0.94,
    googlePitch: -3,
  },
  'cavus-komutan': {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '+10%',
    pitch: '-3Hz',
    volume: '+100%',
    yell: 'bark',
    googleName: 'tr-TR-Standard-D',
    googleRate: 1.1,
    googlePitch: -1,
  },
  'taksi-soforu': {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '+6%',
    pitch: '+0Hz',
    volume: '+100%',
    yell: 'yell',
    googleName: 'tr-TR-Standard-B',
    googleRate: 1.06,
    googlePitch: 0,
  },
  'zehirli-ex': {
    edgeVoice: 'tr-TR-EmelNeural',
    rate: '+2%',
    pitch: '+0Hz',
    volume: '+75%',
    yell: 'scold',
    googleName: 'tr-TR-Standard-A',
    googleRate: 1.03,
    googlePitch: 0,
  },
  'acil-doktor': {
    edgeVoice: 'tr-TR-EmelNeural',
    rate: '+0%',
    pitch: '+0Hz',
    volume: '+45%',
    yell: 'cold',
    googleName: 'tr-TR-Standard-C',
    googleRate: 1.0,
    googlePitch: 0,
  },
  'gece-bekcisi': {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '-3%',
    pitch: '-4Hz',
    volume: '+65%',
    yell: 'growl',
    googleName: 'tr-TR-Standard-D',
    googleRate: 0.96,
    googlePitch: -2,
  },
};

const DEFAULT_VOICE: VoiceProfile = {
  edgeVoice: 'tr-TR-AhmetNeural',
  rate: '+4%',
  pitch: '+0Hz',
  volume: '+100%',
  yell: 'yell',
  googleName: 'tr-TR-Standard-B',
  googleRate: 1.05,
  googlePitch: 0,
};

/**
 * Akıcı konuşma: kelime kelime ünlem / HEY / … kaldır.
 * Bağırma hissi prosody’den gelir, metin parçalamaktan değil.
 */
export function prepareSpeechText(text: string, mode: YellMode): string {
  let t = text.replace(/\s+/g, ' ').trim();
  if (!t) return t;

  // Duraklatan işaretleri yumuşat
  t = t.replace(/…+/g, ',');
  t = t.replace(/\.{2,}/g, ',');
  t = t.replace(/\s*[—–]\s*/g, ', ');
  t = t.replace(/\s+-\s+/g, ', ');

  // Aşırı ünlem/soru → tek
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\?{2,}/g, '?');
  t = t.replace(/([!?])\s*\1+/g, '$1');

  // Virgül yığınını sadeleştir
  t = t.replace(/,\s*,+/g, ',');
  t = t.replace(/\s+,/g, ',');

  // Bağırış modlarında cümleyi tek güçlü ünlemle bitir (ek slogan yok)
  if (mode === 'yell' || mode === 'bark' || mode === 'scold') {
    t = t.replace(/[.!?]+$/u, '');
    t = `${t}!`;
  } else if (mode === 'growl') {
    t = t.replace(/[.!?]+$/u, '');
    t = `${t}.`;
  }

  if (t.length > MAX_CHARS) t = t.slice(0, MAX_CHARS - 1).trim();
  return t;
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly config: ConfigService) {}

  async synthesizeTurkish(
    text: string,
    characterSlug?: string | null,
  ): Promise<Buffer> {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) throw new BadRequestException('Metin boş');
    if (cleaned.length > MAX_CHARS) {
      throw new BadRequestException(`Metin en fazla ${MAX_CHARS} karakter`);
    }

    const voice =
      (characterSlug && VOICE_BY_SLUG[characterSlug]) || DEFAULT_VOICE;
    const spoken = prepareSpeechText(cleaned, voice.yell);

    const apiKey =
      this.config.get<string>('GOOGLE_TTS_API_KEY') ||
      this.config.get<string>('GOOGLE_API_KEY');

    if (apiKey) {
      try {
        return await this.googleCloudTts(spoken, apiKey, voice);
      } catch (e) {
        this.logger.warn(
          `Google TTS başarısız, Edge’e düşülüyor: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    try {
      return await this.edgeTts(spoken, voice);
    } catch (e) {
      this.logger.warn(
        `Edge TTS başarısız, Translate proxy: ${e instanceof Error ? e.message : e}`,
      );
      return this.translateTtsProxy(spoken);
    }
  }

  private async edgeTts(text: string, voice: VoiceProfile): Promise<Buffer> {
    const communicate = new Communicate(text, {
      voice: voice.edgeVoice,
      rate: voice.rate,
      pitch: voice.pitch,
      volume: voice.volume,
    });
    const parts: Buffer[] = [];
    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        parts.push(Buffer.from(chunk.data));
      }
    }
    if (!parts.length) {
      throw new BadRequestException('Edge TTS ses dönmedi');
    }
    return Buffer.concat(parts);
  }

  private async googleCloudTts(
    text: string,
    apiKey: string,
    voice: VoiceProfile,
  ): Promise<Buffer> {
    const loud = voice.yell === 'yell' || voice.yell === 'bark';
    const ssml = `<speak><prosody rate="${Math.round(voice.googleRate * 100)}%" pitch="${voice.googlePitch >= 0 ? '+' : ''}${voice.googlePitch}st" volume="${loud ? '+8dB' : '+4dB'}">${escapeXml(text)}</prosody></speak>`;

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { ssml },
          voice: {
            languageCode: 'tr-TR',
            name: voice.googleName,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: voice.googleRate,
            pitch: voice.googlePitch,
            volumeGainDb: loud ? 8 : 4,
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
          `TTS proxy başarısız (${res.status}). Ağ / Edge TTS kontrol et.`,
        );
      }
      buffers.push(Buffer.from(await res.arrayBuffer()));
    }

    return Buffer.concat(buffers);
  }
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
