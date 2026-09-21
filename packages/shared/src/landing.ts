export type LandingLink = {
  label: string;
  href: string;
};

export type LandingStep = {
  title: string;
  body: string;
};

export type LandingCastItem = {
  name: string;
  blurb: string;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingContent = {
  meta: {
    title: string;
    description: string;
    canonical: string;
    ogImage: string;
    keywords: string;
    siteUrl: string;
  };
  nav: {
    brand: string;
    linkLabel: string;
    linkHref: string;
  };
  hero: {
    brand: string;
    headline: string;
    sub: string;
    primaryCta: LandingLink;
    secondaryCta: LandingLink;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: LandingStep[];
  };
  characters: {
    title: string;
    subtitle: string;
    items: LandingCastItem[];
  };
  faq: {
    title: string;
    subtitle: string;
    items: LandingFaqItem[];
  };
  download: {
    title: string;
    body: string;
    primaryCta: LandingLink;
    secondaryCta: LandingLink;
  };
  footer: {
    left: string;
    right: string;
    privacyLabel: string;
    privacyHref: string;
    termsLabel: string;
    termsHref: string;
  };
};

export const SITE_URL = 'https://hydrorage.com.tr';

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  meta: {
    title: 'HydroRage — Su içmezsen küfür yersin',
    description:
      'HydroRage: hidrasyon takibi, sesli tehdit ve haftalık utanç karnesi. Su içmezsen küfür yersin. Güvenli mod da var.',
    canonical: `${SITE_URL}/`,
    ogImage: `${SITE_URL}/og-image.svg`,
    keywords:
      'hidrasyon, su hatırlatıcı, su iç, dehidrasyon, motivasyon, HydroRage',
    siteUrl: SITE_URL,
  },
  nav: {
    brand: 'HydroRage',
    linkLabel: 'Nasıl çalışır',
    linkHref: '#nasil',
  },
  hero: {
    brand: 'HydroRage',
    headline: 'Su içmezsen küfür yersin.',
    sub: 'Hidrasyon takibi, sesli tehdit ve haftalık utanç karnesi. Su hedefini kaçırma — karakterler hatırlatır, üstelik nazik değiller. İstersen güvenli modda küfürsüz uyarı al.',
    primaryCta: {
      label: 'App Store',
      href: 'https://apps.apple.com/app/hydrorage',
    },
    secondaryCta: {
      label: 'Google Play',
      href: 'https://play.google.com/store/apps/details?id=com.hydrorage.app',
    },
  },
  howItWorks: {
    title: 'Üç adım. Sıfır bahane.',
    subtitle:
      'Hedefi koy, içtiğini kaydet, unutursan uygulamayı konuşurken duy.',
    steps: [
      {
        title: 'Hedefini kilitle',
        body: 'Günlük litre hedefini belirle. Streak’in peşinden koş.',
      },
      {
        title: 'Hızlı ekle',
        body: 'Su, kahve, elektrolit — net hidrasyon otomatik hesaplanır.',
      },
      {
        title: 'Tehdidi duy',
        body: 'Rutin kaçınca sesli azar. Karakter seç, +18 veya güvenli mod.',
      },
    ],
  },
  characters: {
    title: 'Kim azarlayacak?',
    subtitle:
      'Bir karakter seç. Motivasyon koçu değil — mahalle abisi daha yakın.',
    items: [
      {
        name: 'Öfkeli Mahalle Abisi',
        blurb:
          'Kapıdan bağırır gibi hatırlatır. Susuzluk bahanesi kabul etmez.',
      },
      {
        name: 'Agresif Fitness Koçu',
        blurb: 'Kafein abartısı + düşük litre = antrenman azarı.',
      },
      {
        name: 'Sinirli Balkan Annesi',
        blurb: '“İç şunu” tonu. Sevgiyle, ama yüksek desibel.',
      },
      {
        name: 'Toksik Kurumsal Yönetici',
        blurb: 'KPI’n su. Raporun haftalık utanç karnesi.',
      },
    ],
  },
  faq: {
    title: 'Sık sorulanlar',
    subtitle: 'Kısa cevaplar — arama ve yapay zekâ motorları için net.',
    items: [
      {
        question: 'HydroRage nedir?',
        answer:
          'HydroRage, günlük su tüketimini takip eden ve hedefini kaçırınca sesli hatırlatma (isteğe bağlı küfürlü ton) yapan bir hidrasyon uygulamasıdır.',
      },
      {
        question: '+18 mod ile güvenli mod farkı nedir?',
        answer:
          '+18 mod açıkken tehdit metinleri küfürlü olabilir. Güvenli modda argo ve küfür olmadan nazik ama net uyarılar gelir.',
      },
      {
        question: 'Günde kaç ml su içmeliyim?',
        answer:
          'Varsayılan hedef 2500 ml’dir; onboarding veya profil ayarından kendi hedefini seçebilirsin. Kahve ve alkol su borcu ekler.',
      },
      {
        question: 'Bildirimler sesli mi okunur?',
        answer:
          'Uygulama açıkken ve sesli bildirimler aktifken bildirim metni TTS ile okunabilir. Ofis veya gece modunda ses kısılır.',
      },
      {
        question: 'Kafein su borcu nasıl hesaplanır?',
        answer:
          'Espresso, filtre kahve, enerji içeceği ve alkol diüretik ceza ml’si ekler; telafi için ekstra su içmen gerekir.',
      },
      {
        question: 'Verilerim nerede tutulur?',
        answer:
          'Hesap ve hidrasyon kayıtların sunucuda saklanır. Ayrıntılar Gizlilik Politikası sayfasındadır.',
      },
      {
        question: 'iOS ve Android’de var mı?',
        answer:
          'Evet. App Store ve Google Play indirme bağlantıları indirme bölümünde yayınlanır.',
      },
      {
        question: 'Küfürlü içerik zorunlu mu?',
        answer:
          'Hayır. Tehdit ayarlarından +18 modu kapatıp güvenli moda geçebilirsin.',
      },
    ],
  },
  download: {
    title: 'Böbreklerin feryat etmeden önce.',
    body: 'HydroRage iOS ve Android’de. Google veya Apple ile gir, suyu takip et, haftalık karneni paylaş — utanmak serbest.',
    primaryCta: {
      label: 'App Store',
      href: 'https://apps.apple.com/app/hydrorage',
    },
    secondaryCta: {
      label: 'Google Play',
      href: 'https://play.google.com/store/apps/details?id=com.hydrorage.app',
    },
  },
  footer: {
    left: '© {{year}} HydroRage',
    right: '',
    privacyLabel: 'Gizlilik',
    privacyHref: '/gizlilik',
    termsLabel: 'Koşullar',
    termsHref: '/kosullar',
  },
};

export const DEFAULT_LANDING_CONTENT_EN: LandingContent = {
  meta: {
    title: 'HydroRage — Skip water, get roasted',
    description:
      'HydroRage: hydration tracking, spoken threats, and a weekly shame report. Miss your water goal and get roasted. Safe mode available.',
    canonical: `${SITE_URL}/`,
    ogImage: `${SITE_URL}/og-image.svg`,
    keywords:
      'hydration, water reminder, drink water, dehydration, motivation, HydroRage',
    siteUrl: SITE_URL,
  },
  nav: {
    brand: 'HydroRage',
    linkLabel: 'How it works',
    linkHref: '#nasil',
  },
  hero: {
    brand: 'HydroRage',
    headline: 'Skip water, get roasted.',
    sub: 'Hydration tracking, spoken threats, and a weekly shame report. Don’t miss your goal — characters remind you, and they are not gentle. Prefer clean language? Turn on safe mode.',
    primaryCta: {
      label: 'App Store',
      href: 'https://apps.apple.com/app/hydrorage',
    },
    secondaryCta: {
      label: 'Google Play',
      href: 'https://play.google.com/store/apps/details?id=com.hydrorage.app',
    },
  },
  howItWorks: {
    title: 'Three steps. Zero excuses.',
    subtitle: 'Set a goal, log what you drink, hear the app when you forget.',
    steps: [
      {
        title: 'Lock your goal',
        body: 'Pick a daily litre target. Chase the streak.',
      },
      {
        title: 'Quick add',
        body: 'Water, coffee, electrolytes — net hydration is calculated for you.',
      },
      {
        title: 'Hear the threat',
        body: 'Miss a routine and get a spoken scolding. Pick a character, +18 or safe.',
      },
    ],
  },
  characters: {
    title: 'Who will scold you?',
    subtitle: 'Pick a character. Not a motivation coach — more like the neighborhood enforcer.',
    items: [
      {
        name: 'Angry Neighborhood Bro',
        blurb: 'Reminds you like he’s yelling from the door. No dehydration excuses.',
      },
      {
        name: 'Aggressive Fitness Coach',
        blurb: 'Too much caffeine + low litres = workout scolding.',
      },
      {
        name: 'Angry Balkan Mom',
        blurb: '“Drink this” energy. Loving, but loud.',
      },
      {
        name: 'Toxic Corporate Manager',
        blurb: 'Your KPI is water. Your report is the weekly shame card.',
      },
    ],
  },
  faq: {
    title: 'FAQ',
    subtitle: 'Short answers — clear for search and AI engines.',
    items: [
      {
        question: 'What is HydroRage?',
        answer:
          'HydroRage tracks daily water intake and delivers spoken reminders (optionally profane) when you miss your goal.',
      },
      {
        question: 'What’s the difference between +18 and safe mode?',
        answer:
          'With +18 on, threat copy can include swearing. Safe mode keeps warnings clean but direct.',
      },
      {
        question: 'How many ml should I drink per day?',
        answer:
          'The default goal is 2500 ml; set your own in onboarding or profile. Coffee and alcohol add water debt.',
      },
      {
        question: 'Are notifications spoken aloud?',
        answer:
          'When the app is open and spoken alerts are on, notification text can be read via TTS. Office or night mode lowers volume.',
      },
      {
        question: 'How is caffeine water debt calculated?',
        answer:
          'Espresso, filter coffee, energy drinks, and alcohol add diuretic penalty ml; drink extra water to compensate.',
      },
      {
        question: 'Where is my data stored?',
        answer:
          'Account and hydration logs are stored on the server. Details are in the Privacy Policy.',
      },
      {
        question: 'Is it on iOS and Android?',
        answer:
          'Yes. App Store and Google Play links are published in the download section.',
      },
      {
        question: 'Is explicit language required?',
        answer:
          'No. Turn off +18 in threat settings to use safe mode.',
      },
    ],
  },
  download: {
    title: 'Before your kidneys start yelling.',
    body: 'HydroRage on iOS and Android. Sign in with Google or Apple, track water, share your weekly report — shame is optional.',
    primaryCta: {
      label: 'App Store',
      href: 'https://apps.apple.com/app/hydrorage',
    },
    secondaryCta: {
      label: 'Google Play',
      href: 'https://play.google.com/store/apps/details?id=com.hydrorage.app',
    },
  },
  footer: {
    left: '© {{year}} HydroRage',
    right: '',
    privacyLabel: 'Privacy',
    privacyHref: '/privacy',
    termsLabel: 'Terms',
    termsHref: '/terms',
  },
};

export type LandingContentByLocale = {
  tr: LandingContent;
  en: LandingContent;
};

export const DEFAULT_LANDING_BY_LOCALE: LandingContentByLocale = {
  tr: DEFAULT_LANDING_CONTENT,
  en: DEFAULT_LANDING_CONTENT_EN,
};

export function defaultLandingForLocale(locale: 'tr' | 'en'): LandingContent {
  return structuredClone(
    locale === 'en' ? DEFAULT_LANDING_CONTENT_EN : DEFAULT_LANDING_CONTENT,
  );
}
