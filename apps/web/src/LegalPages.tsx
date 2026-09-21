import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { loadPlausible } from './seo';
import { SiteFooter } from './SiteFooter';
import { CookieBanner } from './CookieBanner';
import { LocaleToggle, useLocale } from './locale';

const UPDATED = '21 Eylül 2026';
const UPDATED_EN = 'September 21, 2026';
const CONTACT = 'destek@hydrorage.com.tr';
const CONTROLLER = 'HydroRage';

export function LegalLayout({
  title,
  children,
  updated,
}: {
  title: string;
  children: React.ReactNode;
  updated?: string;
}) {
  const { pathname } = useLocation();
  const { locale, t } = useLocale();

  const legalNav =
    locale === 'en'
      ? [
          { to: '/privacy', label: t('web.footer.privacy') },
          { to: '/terms', label: t('web.footer.terms') },
          { to: '/cookies', label: t('web.footer.cookies') },
        ]
      : [
          { to: '/gizlilik', label: t('web.footer.privacy') },
          { to: '/kosullar', label: t('web.footer.terms') },
          { to: '/kvkk', label: t('web.footer.kvkk') },
          { to: '/aydinlatma-metni', label: t('web.footer.disclosure') },
          { to: '/cerez-politikasi', label: t('web.footer.cookies') },
        ];

  useEffect(() => {
    document.title = `${title} — HydroRage`;
    loadPlausible();
  }, [title]);

  return (
    <div className="page legal-page">
      <header className="legal-header">
        <Link className="brand-mark" to="/">
          HydroRage
        </Link>
        <nav className="nav-links">
          <Link className="nav-link" to="/">
            {t('common.home')}
          </Link>
          <Link className="nav-link" to="/blog">
            {t('common.blog')}
          </Link>
          <LocaleToggle />
        </nav>
      </header>
      <article className="legal-body">
        <nav
          className="legal-nav"
          aria-label={locale === 'en' ? 'Legal documents' : 'Yasal belgeler'}
        >
          {legalNav.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              aria-current={pathname === l.to ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <h1>{title}</h1>
        <p className="legal-updated">
          {locale === 'en' ? 'Last updated' : 'Son güncelleme'}:{' '}
          {updated ?? (locale === 'en' ? UPDATED_EN : UPDATED)}
        </p>
        {children}
      </article>
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Gizlilik Politikası">
      <p>
        Bu Gizlilik Politikası, {CONTROLLER} (“uygulama”, “biz”) tarafından
        sunulan hidrasyon takip ve hatırlatma hizmetinde kişisel verilerinizin
        nasıl işlendiğini açıklar. 6698 sayılı Kişisel Verilerin Korunması
        Kanunu (KVKK) ve ilgili mevzuat çerçevesinde hazırlanmıştır.
      </p>

      <h2>1. Veri sorumlusu</h2>
      <p>
        Veri sorumlusu: {CONTROLLER}. İletişim: {CONTACT}
      </p>

      <h2>2. Toplanan kişisel veriler</h2>
      <ul>
        <li>
          <strong>Kimlik / iletişim:</strong> e-posta, görünen ad (Google veya
          Apple ile giriş)
        </li>
        <li>
          <strong>Hesap ve kullanım:</strong> içecek kayıtları, günlük hedef
          (ml), tehdit/ayar tercihleri, +18 / güvenli mod, streak ve istatistik
          özetleri
        </li>
        <li>
          <strong>Cihaz:</strong> bildirim (push) token’ı — hatırlatmalar için
        </li>
        <li>
          <strong>Teknik:</strong> oturum token’ları, hata / güvenlik logları
          (makul süre)
        </li>
      </ul>

      <h2>3. İşleme amaçları</h2>
      <p>
        Hizmeti sunmak, hatırlatmaları zamanlamak, sesli/uygulama içi uyarıları
        çalıştırmak, istatistik göstermek, hesabı güvenceye almak ve yasal
        yükümlülükleri yerine getirmek.
      </p>

      <h2>4. Hukuki sebepler</h2>
      <p>
        KVKK m.5 kapsamında: sözleşmenin kurulması/ifası, meşru menfaat
        (güvenlik, ürün iyileştirme — temel haklarınıza zarar vermeyecek
        ölçüde), açık rıza gerektiren hallerde rızanız.
      </p>

      <h2>5. Saklama süresi</h2>
      <p>
        Veriler, hesabınız aktif olduğu sürece ve silme talebinden sonra yasal
        saklama süreleri saklı kalmak kaydıyla silinir veya anonimleştirilir.
        Hesap silme: uygulama içi “Hesabımı sil” veya {CONTACT}.
      </p>

      <h2>6. Aktarım ve üçüncü taraflar</h2>
      <p>
        Kimlik doğrulama için Google / Apple; barındırma ve altyapı
        sağlayıcıları; isteğe bağlı olarak çerezsiz / gizlilik odaklı analitik
        (ör. Plausible). Veriler yurt dışına aktarılırsa KVKK’nın aradığı
        güvenceler aranır.
      </p>

      <h2>7. Haklarınız</h2>
      <p>
        KVKK m.11 kapsamında bilgilendirme, erişim, düzeltme, silme, itiraz ve
        şikâyet haklarınız vardır. Taleplerinizi {CONTACT} adresine iletebilir;
        sonuçtan memnun kalmazsanız Kişisel Verileri Koruma Kurulu’na
        başvurabilirsiniz. Ayrıntılar için{' '}
        <Link to="/kvkk">KVKK</Link> ve{' '}
        <Link to="/aydinlatma-metni">Aydınlatma Metni</Link> sayfalarına bakın.
      </p>

      <h2>8. Çerezler</h2>
      <p>
        Web sitesinde kullanılan çerezler{' '}
        <Link to="/cerez-politikasi">Çerez Politikası</Link>’nda açıklanır.
      </p>

      <h2>9. İletişim</h2>
      <p>Gizlilik ve KVKK talepleri: {CONTACT}</p>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Kullanıcı Sözleşmesi">
      <p>
        HydroRage mobil uygulamasını ve hydrorage.com.tr web sitesini
        kullanarak bu Kullanıcı Sözleşmesi’ni kabul etmiş sayılırsınız.
        Hizmeti kullanmaya devam etmeniz kabul anlamına gelir.
      </p>

      <h2>1. Hizmetin niteliği</h2>
      <p>
        HydroRage; hidrasyon takibi, hatırlatma ve (isteğe bağlı) sesli / yazılı
        motivasyon uyarıları sunan bir eğlence ve alışkanlık uygulamasıdır.
        <strong> Tıbbi tavsiye, teşhis veya tedavi değildir.</strong> Sağlık
        endişeniz varsa hekime danışın.
      </p>

      <h2>2. Yaş ve +18 içerik</h2>
      <p>
        +18 mod açıkken sesli ve yazılı uyarılar argo veya küfür içerebilir.
        Güvenli moda geçerek bunu kapatabilirsiniz. 18 yaşından küçük
        kullanıcıların güvenli modu kullanması gerekir; ebeveyn gözetimi
        önerilir.
      </p>

      <h2>3. Hesap ve güvenlik</h2>
      <p>
        Google / Apple hesabınızla giriş yapabilirsiniz. Hesap güvenliği sizin
        sorumluluğunuzdadır. Hizmeti kötüye kullanmak, tersine mühendislik
        yapmak veya başkalarının hesabına izinsiz erişmek yasaktır.
      </p>

      <h2>4. Kullanıcı içeriği ve davranış</h2>
      <p>
        Özel şablon veya ayarlarınız yasalara ve üçüncü kişi haklarına aykırı
        olmamalıdır. Topluluk standartlarını ihlal eden hesaplar askıya
        alınabilir.
      </p>

      <h2>5. Fikri mülkiyet</h2>
      <p>
        HydroRage markası, arayüz, karakterler ve içeriklerin hakları bize
        aittir. İzin olmadan ticari kullanım yasaktır.
      </p>

      <h2>6. Sorumluluğun sınırlandırılması</h2>
      <p>
        Uygulamayı “olduğu gibi” sunuyoruz. Seçtiğiniz içerik tonu, kaçırılan
        hatırlatmalar veya hidrasyon alışkanlığınızdan doğan sonuçlardan yasal
        olarak sorumlu tutulamayız. Zorunlu tüketici hakları saklıdır.
      </p>

      <h2>7. Hesap silme ve fesih</h2>
      <p>
        İstediğiniz zaman hesabınızı silebilirsiniz. Sözleşmeyi ihlal
        ederseniz erişimi sonlandırabiliriz. Silme sonrası veriler{' '}
        <Link to="/gizlilik">Gizlilik Politikası</Link>’na göre işlenir.
      </p>

      <h2>8. Değişiklikler</h2>
      <p>
        Bu sözleşmeyi güncelleyebiliriz. Önemli değişikliklerde uygulamada veya
        sitede bilgilendirme yapılır. Güncel metin bu sayfada yayınlanır.
      </p>

      <h2>9. İletişim</h2>
      <p>{CONTACT}</p>
    </LegalLayout>
  );
}

export function KvkkPage() {
  return (
    <LegalLayout title="KVKK Bilgilendirme">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında HydroRage
        kullanıcılarına yönelik özet bilgilendirmedir. Detaylı aydınlatma için{' '}
        <Link to="/aydinlatma-metni">Aydınlatma Metni</Link>’ne bakınız.
      </p>

      <h2>Veri sorumlusu</h2>
      <p>
        {CONTROLLER} — {CONTACT}
      </p>

      <h2>İşlenen başlıca veri kategorileri</h2>
      <ul>
        <li>Kimlik / iletişim (e-posta, ad)</li>
        <li>Kullanıcı işlem (hidrasyon kayıtları, ayarlar)</li>
        <li>Cihaz / bildirim verileri</li>
      </ul>

      <h2>Haklarınız (KVKK m.11)</h2>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
        <li>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
        <li>Yurt içinde / dışında aktarıldığı üçüncü kişileri bilme</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
        <li>KVKK m.7 çerçevesinde silinmesini / yok edilmesini isteme</li>
        <li>Aktarılan üçüncü kişilere bildirilmesini isteme</li>
        <li>Münhasıran otomatik sistemlerle aleyhinize sonuç çıkmasına itiraz</li>
        <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
      </ul>

      <h2>Başvuru</h2>
      <p>
        Taleplerinizi yazılı olarak veya KVKK’nın öngördüğü diğer yöntemlerle{' '}
        {CONTACT} adresine iletebilirsiniz. Başvurularınız en geç 30 gün içinde
        yanıtlanır. Gerekirse Kişisel Verileri Koruma Kurulu’na şikâyette
        bulunabilirsiniz.
      </p>

      <h2>İlgili belgeler</h2>
      <ul>
        <li>
          <Link to="/aydinlatma-metni">Aydınlatma Metni</Link>
        </li>
        <li>
          <Link to="/gizlilik">Gizlilik Politikası</Link>
        </li>
        <li>
          <Link to="/cerez-politikasi">Çerez Politikası</Link>
        </li>
      </ul>
    </LegalLayout>
  );
}

export function AydinlatmaPage() {
  return (
    <LegalLayout title="Aydınlatma Metni">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 10. maddesi ve
        Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve
        Esaslar Hakkında Tebliğ uyarınca aşağıda bilgilendirilirsiniz.
      </p>

      <h2>1. Veri sorumlusunun kimliği</h2>
      <p>
        Unvan: {CONTROLLER}
        <br />
        E-posta: {CONTACT}
        <br />
        Web: https://hydrorage.com.tr
      </p>

      <h2>2. Kişisel verilerin işlenme amacı</h2>
      <ul>
        <li>Üyelik / oturum açma ve hesap yönetimi</li>
        <li>Hidrasyon hedefi, kayıt ve istatistiklerin sunulması</li>
        <li>Hatırlatma, bildirim ve (tercihe bağlı) sesli uyarıların iletilmesi</li>
        <li>Güvenlik, dolandırıcılık önleme ve teknik destek</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi</li>
      </ul>

      <h2>3. İşlenen kişisel veri kategorileri</h2>
      <p>
        Kimlik, iletişim, kullanıcı işlem, işlem güvenliği ve (izin verilen
        ölçüde) pazarlama / analitik verileri.
      </p>

      <h2>4. Aktarım</h2>
      <p>
        Verileriniz; kimlik doğrulama sağlayıcıları (Google, Apple), barındırma
        / bulut altyapısı ve yasal zorunluluk halinde yetkili kamu kurumlarıyla
        paylaşılabilir. Yurt dışı aktarımda KVKK güvenceleri aranır.
      </p>

      <h2>5. Toplama yöntemi ve hukuki sebep</h2>
      <p>
        Veriler; uygulama / web formları, OAuth girişleri, cihaz bildirim API’leri
        ve otomatik loglar yoluyla elektronik ortamda toplanır. Hukuki
        sebepler: sözleşmenin ifası, meşru menfaat, açık rıza (gerektiğinde) ve
        kanunda açıkça öngörülmesi.
      </p>

      <h2>6. İlgili kişinin hakları</h2>
      <p>
        KVKK m.11’deki haklarınızı kullanmak için {CONTACT} adresine başvurun.
        Ayrıntılı liste <Link to="/kvkk">KVKK Bilgilendirme</Link> sayfasındadır.
      </p>

      <h2>7. Saklama</h2>
      <p>
        Veriler, işleme amacının gerektirdiği süre ve ilgili mevzuattaki
        zamanaşımı süreleri boyunca saklanır; süre sonunda silinir, yok edilir
        veya anonim hale getirilir.
      </p>
    </LegalLayout>
  );
}

export function CookiePage() {
  return (
    <LegalLayout title="Çerez Politikası">
      <p>
        Bu metin, hydrorage.com.tr üzerinde kullanılan çerezler ve benzeri
        teknolojiler hakkında bilgilendirir. Mobil uygulamadaki yerel depolama
        (ör. tercihler, oturum) cihazınızda tutulur ve bu politikanın web
        kapsamı dışındadır.
      </p>

      <h2>1. Çerez nedir?</h2>
      <p>
        Çerezler, bir web sitesini ziyaret ettiğinizde cihazınıza kaydedilen
        küçük metin dosyalarıdır. Oturumun sürmesine, tercihlerin hatırlanmasına
        veya (izin verirseniz) kullanımın ölçülmesine yardımcı olur.
      </p>

      <h2>2. Kullandığımız çerez türleri</h2>
      <ul>
        <li>
          <strong>Zorunlu / işlevsel:</strong> site güvenliği, temel navigasyon
          ve çerez tercihinin (`hr_cookie_ok`) hatırlanması.
        </li>
        <li>
          <strong>Analitik (isteğe bağlı):</strong> Plausible gibi gizlilik
          odaklı, mümkün olduğunca çerezsiz yapılandırılabilen ölçüm araçları.
          Kabul bandından onay vermeden pazarlama profillemesi yapılmaz.
        </li>
      </ul>

      <h2>3. Saklama</h2>
      <p>
        Tercih çerezi / localStorage kaydı cihazınızda kalır; tarayıcı
        ayarlarından silebilirsiniz. Analitik sağlayıcıların saklama süreleri
        kendi politikalarına tabidir.
      </p>

      <h2>4. Yönetim</h2>
      <p>
        Tarayıcı ayarlarından çerezleri engelleyebilir veya silebilirsiniz.
        Zorunlu çerezler olmadan bazı özellikler çalışmayabilir. Onayınızı
        geri almak için localStorage’daki `hr_cookie_ok` kaydını silip sayfayı
        yenileyebilirsiniz.
      </p>

      <h2>5. Daha fazla bilgi</h2>
      <p>
        Kişisel veriler için <Link to="/gizlilik">Gizlilik Politikası</Link> ve{' '}
        <Link to="/aydinlatma-metni">Aydınlatma Metni</Link>. Sorular:{' '}
        {CONTACT}
      </p>
    </LegalLayout>
  );
}

export function PrivacyPageEn() {
  return (
    <LegalLayout title="Privacy Policy" updated={UPDATED_EN}>
      <p>
        This Privacy Policy explains how {CONTROLLER} (“the app”, “we”) processes
        personal data in our hydration tracking and reminder service. It is
        prepared with reference to Turkey’s Personal Data Protection Law (KVKK)
        No. 6698 and related rules.
      </p>
      <h2>1. Data controller</h2>
      <p>
        Controller: {CONTROLLER}. Contact: {CONTACT}
      </p>
      <h2>2. Data we collect</h2>
      <ul>
        <li>
          <strong>Identity / contact:</strong> email, display name (Google or
          Apple sign-in)
        </li>
        <li>
          <strong>Account & usage:</strong> drink logs, daily goal (ml), threat /
          settings preferences, +18 / safe mode, streak and stats summaries
        </li>
        <li>
          <strong>Device:</strong> push notification token — for reminders
        </li>
        <li>
          <strong>Technical:</strong> session tokens, error / security logs
          (reasonable retention)
        </li>
      </ul>
      <h2>3. Purposes</h2>
      <p>
        Providing the service, scheduling reminders, running spoken / in-app
        alerts, showing stats, securing accounts, and meeting legal duties.
      </p>
      <h2>4. Your rights</h2>
      <p>
        Under KVKK Art. 11 you may request information, access, correction,
        deletion, objection, and complaint. Email {CONTACT}. For Turkey-specific
        notices see the Turkish KVKK pages when browsing in Turkish.
      </p>
      <h2>5. Cookies</h2>
      <p>
        Website cookies are described in the{' '}
        <Link to="/cookies">Cookie Policy</Link>.
      </p>
      <h2>6. Contact</h2>
      <p>Privacy requests: {CONTACT}</p>
    </LegalLayout>
  );
}

export function TermsPageEn() {
  return (
    <LegalLayout title="Terms of Use" updated={UPDATED_EN}>
      <p>
        By using the HydroRage mobile app and hydrorage.com.tr you accept these
        Terms. Continued use means acceptance.
      </p>
      <h2>1. Nature of the service</h2>
      <p>
        HydroRage is a habit and entertainment app for hydration tracking,
        reminders, and optional spoken / written motivational alerts.
        <strong> It is not medical advice, diagnosis, or treatment.</strong>{' '}
        Seek a clinician for health concerns.
      </p>
      <h2>2. Age and +18 content</h2>
      <p>
        With +18 on, alerts may include strong language. Switch to safe mode to
        turn that off. Users under 18 should use safe mode; parental guidance is
        recommended.
      </p>
      <h2>3. Account & security</h2>
      <p>
        You may sign in with Google / Apple. Account security is your
        responsibility. Abuse, reverse engineering, or unauthorized access is
        prohibited.
      </p>
      <h2>4. Limitation of liability</h2>
      <p>
        The app is provided “as is”. We are not liable for content tone you
        choose, missed reminders, or outcomes of your hydration habits. Mandatory
        consumer rights remain.
      </p>
      <h2>5. Contact</h2>
      <p>{CONTACT}</p>
    </LegalLayout>
  );
}

export function CookiePageEn() {
  return (
    <LegalLayout title="Cookie Policy" updated={UPDATED_EN}>
      <p>
        This page explains cookies and similar technologies on hydrorage.com.tr.
        Local storage in the mobile app (preferences, session) stays on your
        device and is outside this web policy.
      </p>
      <h2>1. What is a cookie?</h2>
      <p>
        Cookies are small text files stored on your device. They help keep a
        session, remember preferences, or (if you allow) measure usage.
      </p>
      <h2>2. Types we use</h2>
      <ul>
        <li>
          <strong>Essential / functional:</strong> site security, basic
          navigation, and remembering cookie consent (`hr_cookie_ok`).
        </li>
        <li>
          <strong>Analytics (optional):</strong> privacy-focused tools such as
          Plausible, configurable to be cookie-light. No marketing profiling
          without consent from the banner.
        </li>
      </ul>
      <h2>3. Management</h2>
      <p>
        You can block or delete cookies in browser settings. Without essential
        cookies some features may not work. To withdraw consent, clear
        `hr_cookie_ok` in localStorage and reload.
      </p>
      <h2>4. More</h2>
      <p>
        See the <Link to="/privacy">Privacy Policy</Link>. Questions: {CONTACT}
      </p>
    </LegalLayout>
  );
}
