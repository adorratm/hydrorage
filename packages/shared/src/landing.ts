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

export type LandingContent = {
  meta: {
    title: string;
    description: string;
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
  download: {
    title: string;
    body: string;
    primaryCta: LandingLink;
    secondaryCta: LandingLink;
  };
  footer: {
    left: string;
    right: string;
  };
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  meta: {
    title: 'HydroRage — Su içmezsen küfür yerin',
    description:
      'HydroRage: hidrasyon takibi, sesli tehdit ve haftalık utanç karnesi. Su içmezsen küfür yerin.',
  },
  nav: {
    brand: 'HydroRage',
    linkLabel: 'Nasıl çalışır',
    linkHref: '#nasil',
  },
  hero: {
    brand: 'HydroRage',
    headline: 'Su içmezsen küfür yerin.',
    sub: 'Hidrasyon takibi, sesli tehdit ve haftalık utanç karnesi. Su hedefini kaçırma — karakterler hatırlatır, üstelik nazik değiller.',
    primaryCta: { label: 'Uygulamayı indir', href: '#indir' },
    secondaryCta: {
      label: 'Admin paneli',
      href: 'http://localhost:5174/login',
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
        body: 'Rutin kaçınca sesli azar. Karakter seç, küfür seviyesini ayarla.',
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
  download: {
    title: 'Böbreklerin feryat etmeden önce.',
    body: 'HydroRage iOS ve Android’de. Google veya Apple ile gir, suyu takip et, haftalık karneni paylaş — utanmak serbest.',
    primaryCta: { label: 'Yakında App Store', href: '#top' },
    secondaryCta: { label: 'Yakında Google Play', href: '#top' },
  },
  footer: {
    left: '© {{year}} HydroRage',
    right: 'api.hydrorage.com.tr · admin.hydrorage.com.tr',
  },
};
