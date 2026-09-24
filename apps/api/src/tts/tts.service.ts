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

type LocaleVoices = { tr: VoiceProfile; en: VoiceProfile };

function enVoice(
  edgeVoice: string,
  googleName: string,
  base: Omit<VoiceProfile, 'edgeVoice' | 'googleName'>,
): VoiceProfile {
  return { ...base, edgeVoice, googleName };
}

/**
 * Türkçe Edge’de iki nöral ses var: erkek Ahmet, kadın Emel.
 * Aynı ses içinde hız ve perde karakteri ayırır.
 */
const VOICE_BY_SLUG: Record<string, LocaleVoices> = {
  'ofkeli-mahalle-abisi': {
    tr: {
      edgeVoice: 'tr-TR-AhmetNeural',
      rate: '+8%',
      pitch: '-6Hz',
      volume: '+90%',
      yell: 'yell',
      googleName: 'tr-TR-Standard-B',
      googleRate: 1.08,
      googlePitch: -2,
    },
    en: enVoice('en-US-GuyNeural', 'en-US-Standard-B', {
      rate: '+4%',
      pitch: '+0Hz',
      volume: '+100%',
      yell: 'yell',
      googleRate: 1.05,
      googlePitch: 0,
    }),
  },
  'agresif-fitness-kocu': {
    tr: {
      edgeVoice: 'tr-TR-AhmetNeural',
      rate: '+36%',
      pitch: '-20Hz',
      volume: '+100%',
      yell: 'bark',
      googleName: 'tr-TR-Standard-D',
      googleRate: 1.32,
      googlePitch: -6,
    },
    en: enVoice('en-US-DavisNeural', 'en-US-Standard-D', {
      rate: '+8%',
      pitch: '-2Hz',
      volume: '+100%',
      yell: 'bark',
      googleRate: 1.08,
      googlePitch: -1,
    }),
  },
  'sinirli-balkan-annesi': {
    tr: {
      edgeVoice: 'tr-TR-EmelNeural',
      rate: '+6%',
      pitch: '+0Hz',
      volume: '+70%',
      yell: 'scold',
      googleName: 'tr-TR-Standard-A',
      googleRate: 1.06,
      googlePitch: 0,
    },
    en: enVoice('en-US-JennyNeural', 'en-US-Standard-F', {
      rate: '+3%',
      pitch: '+1Hz',
      volume: '+90%',
      yell: 'scold',
      googleRate: 1.04,
      googlePitch: 1,
    }),
  },
  'toksik-kurumsal-yonetici': {
    tr: {
      edgeVoice: 'tr-TR-AhmetNeural',
      rate: '-22%',
      pitch: '+2Hz',
      volume: '+0%',
      yell: 'cold',
      googleName: 'tr-TR-Standard-C',
      googleRate: 0.78,
      googlePitch: 1,
    },
    en: enVoice('en-US-ChristopherNeural', 'en-US-Standard-D', {
      rate: '-6%',
      pitch: '-4Hz',
      volume: '+20%',
      yell: 'cold',
      googleRate: 0.94,
      googlePitch: -2,
    }),
  },
  dracula: {
    tr: {
      edgeVoice: 'tr-TR-AhmetNeural',
      rate: '-28%',
      pitch: '-30Hz',
      volume: '+15%',
      yell: 'growl',
      googleName: 'tr-TR-Standard-B',
      googleRate: 0.72,
      googlePitch: -8,
    },
    en: enVoice('en-US-RogerNeural', 'en-US-Standard-D', {
      rate: '-12%',
      pitch: '-8Hz',
      volume: '+40%',
      yell: 'growl',
      googleRate: 0.88,
      googlePitch: -4,
    }),
  },
  'cavus-komutan': {
    tr: {
      edgeVoice: 'tr-TR-AhmetNeural',
      rate: '+42%',
      pitch: '-12Hz',
      volume: '+100%',
      yell: 'bark',
      googleName: 'tr-TR-Standard-D',
      googleRate: 1.38,
      googlePitch: -4,
    },
    en: enVoice('en-US-BrianNeural', 'en-US-Standard-D', {
      rate: '+16%',
      pitch: '-6Hz',
      volume: '+100%',
      yell: 'bark',
      googleRate: 1.14,
      googlePitch: -2,
    }),
  },
  'taksi-soforu': {
    tr: {
      edgeVoice: 'tr-TR-AhmetNeural',
      rate: '+26%',
      pitch: '+12Hz',
      volume: '+75%',
      yell: 'yell',
      googleName: 'tr-TR-Standard-B',
      googleRate: 1.22,
      googlePitch: 4,
    },
    en: enVoice('en-US-EricNeural', 'en-US-Standard-B', {
      rate: '+14%',
      pitch: '+2Hz',
      volume: '+90%',
      yell: 'yell',
      googleRate: 1.12,
      googlePitch: 1,
    }),
  },
  'zehirli-ex': {
    tr: {
      edgeVoice: 'tr-TR-EmelNeural',
      rate: '-8%',
      pitch: '-4Hz',
      volume: '+25%',
      yell: 'scold',
      googleName: 'tr-TR-Standard-A',
      googleRate: 0.92,
      googlePitch: -1,
    },
    en: enVoice('en-US-AriaNeural', 'en-US-Standard-C', {
      rate: '-4%',
      pitch: '+6Hz',
      volume: '+55%',
      yell: 'scold',
      googleRate: 0.98,
      googlePitch: 2,
    }),
  },
  'acil-doktor': {
    tr: {
      edgeVoice: 'tr-TR-EmelNeural',
      rate: '-8%',
      pitch: '-8Hz',
      volume: '+10%',
      yell: 'cold',
      googleName: 'tr-TR-Standard-C',
      googleRate: 0.92,
      googlePitch: -2,
    },
    en: enVoice('en-US-EmmaNeural', 'en-US-Standard-E', {
      rate: '-8%',
      pitch: '+0Hz',
      volume: '+25%',
      yell: 'cold',
      googleRate: 0.94,
      googlePitch: 0,
    }),
  },
  'gece-bekcisi': {
    tr: {
      edgeVoice: 'tr-TR-AhmetNeural',
      rate: '-16%',
      pitch: '-22Hz',
      volume: '+10%',
      yell: 'growl',
      googleName: 'tr-TR-Standard-D',
      googleRate: 0.82,
      googlePitch: -6,
    },
    en: enVoice('en-US-AndrewNeural', 'en-US-Standard-I', {
      rate: '-10%',
      pitch: '-8Hz',
      volume: '+35%',
      yell: 'growl',
      googleRate: 0.9,
      googlePitch: -3,
    }),
  },
  'seksi-ses': {
    tr: {
      edgeVoice: 'fr-FR-VivienneMultilingualNeural',
      rate: '-34%',
      pitch: '-4Hz',
      volume: '+15%',
      yell: 'cold',
      googleName: 'tr-TR-Standard-A',
      googleRate: 0.7,
      googlePitch: -1,
    },
    en: enVoice('fr-FR-VivienneMultilingualNeural', 'en-US-Standard-F', {
      rate: '-34%',
      pitch: '-4Hz',
      volume: '+15%',
      yell: 'cold',
      googleRate: 0.7,
      googlePitch: -1,
    }),
  },
  'gotik-leydi': {
    tr: {
      edgeVoice: 'de-DE-SeraphinaMultilingualNeural',
      rate: '-20%',
      pitch: '-10Hz',
      volume: '+15%',
      yell: 'growl',
      googleName: 'tr-TR-Standard-C',
      googleRate: 0.8,
      googlePitch: -3,
    },
    en: enVoice('de-DE-SeraphinaMultilingualNeural', 'en-US-Standard-E', {
      rate: '-20%',
      pitch: '-10Hz',
      volume: '+15%',
      yell: 'growl',
      googleRate: 0.8,
      googlePitch: -3,
    }),
  },
  'japon-ses': {
    tr: {
      edgeVoice: 'ja-JP-NanamiNeural',
      rate: '-22%',
      pitch: '-2Hz',
      volume: '+25%',
      yell: 'cold',
      googleName: 'tr-TR-Standard-A',
      googleRate: 0.94,
      googlePitch: 0,
    },
    en: enVoice('ja-JP-NanamiNeural', 'en-US-Standard-C', {
      rate: '-22%',
      pitch: '-2Hz',
      volume: '+25%',
      yell: 'cold',
      googleRate: 0.94,
      googlePitch: 0,
    }),
  },
};

const DEFAULT_VOICE: LocaleVoices = {
  tr: {
    edgeVoice: 'tr-TR-AhmetNeural',
    rate: '+4%',
    pitch: '+0Hz',
    volume: '+100%',
    yell: 'yell',
    googleName: 'tr-TR-Standard-B',
    googleRate: 1.05,
    googlePitch: 0,
  },
  en: {
    edgeVoice: 'en-US-GuyNeural',
    rate: '+4%',
    pitch: '+0Hz',
    volume: '+100%',
    yell: 'yell',
    googleName: 'en-US-Standard-B',
    googleRate: 1.05,
    googlePitch: 0,
  },
};

/**
 * Akıcı konuşma: kelime kelime ünlem / HEY / … kaldır.
 * Bağırma hissi prosody’den gelir, metin parçalamaktan değil.
 */
export function prepareSpeechText(text: string, mode: YellMode): string {
  let t = text.replace(/\s+/g, ' ').trim();
  if (!t) return t;

  // ahh / ıhh cümlede okunmaz; Japon sesi bunları harf harf söyler.
  t = t.replace(/(?:a{2,}|ı{1,}|i{2,}|m{2,})h+/giu, '');
  t = t.replace(/\bm{3,}\b/giu, '');
  t = t.replace(/やめてええ、くださいいい、やめてください/g, '');
  t = t.replace(/やめてええ、くださいいい/g, '');
  t = t.replace(/やめてください[。.]?/g, '');
  t = t.replace(/\s{2,}/g, ' ').trim();

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
    locale: 'tr' | 'en' = 'tr',
  ): Promise<Buffer> {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) throw new BadRequestException('Metin boş');
    if (cleaned.length > MAX_CHARS) {
      throw new BadRequestException(`Metin en fazla ${MAX_CHARS} karakter`);
    }

    const pair =
      (characterSlug && VOICE_BY_SLUG[characterSlug]) || DEFAULT_VOICE;
    const voice = varyRate(pair[locale] ?? pair.tr, cleaned);
    const spoken = prepareSpeechText(cleaned, voice.yell);
    if (!spoken) throw new BadRequestException('Metin boş');
    const langCode = locale === 'en' ? 'en-US' : 'tr-TR';
    const tl = locale === 'en' ? 'en' : 'tr';

    const apiKey =
      this.config.get<string>('GOOGLE_TTS_API_KEY') ||
      this.config.get<string>('GOOGLE_API_KEY');

    return this.speakClip(spoken, voice, apiKey, langCode, tl);
  }

  private async speakClip(
    text: string,
    voice: VoiceProfile,
    apiKey: string | undefined,
    langCode: string,
    tl: string,
  ): Promise<Buffer> {
    const spoken = text.replace(/\s+/g, ' ').trim();
    if (!spoken) return Buffer.alloc(0);
    if (apiKey) {
      try {
        return await this.googleCloudTts(spoken, apiKey, voice, langCode);
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
      return this.translateTtsProxy(spoken, tl);
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
    languageCode: string,
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
            languageCode,
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

  private async translateTtsProxy(
    text: string,
    tl: string,
  ): Promise<Buffer> {
    const parts = splitChunks(text, CHUNK);
    const buffers: Buffer[] = [];

    for (const part of parts) {
      const url =
        'https://translate.google.com/translate_tts?' +
        new URLSearchParams({
          ie: 'UTF-8',
          client: 'tw-ob',
          tl,
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

/** Aynı karakterde satırlar birebir aynı tempoda okunmasın. Perdeye dokunmaz. */
function varyRate(voice: VoiceProfile, text: string): VoiceProfile {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash + text.charCodeAt(i) * (i + 1)) % 13;
  }
  const delta = hash - 6;
  const current = Number.parseInt(voice.rate, 10) || 0;
  const next = Math.max(-35, Math.min(45, current + delta));
  return {
    ...voice,
    rate: `${next >= 0 ? '+' : ''}${next}%`,
    googleRate: Math.min(1.4, Math.max(0.75, voice.googleRate + delta / 100)),
  };
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
