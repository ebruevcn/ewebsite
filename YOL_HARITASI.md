# Yol Haritası ve İlerleme Takibi

> Bu belge projenin **canlı durum kaydıdır**. Her çalışma oturumunun başında okunur, sonunda güncellenir.
> Detaylı gereksinimler: [PROJE_PLANI.md](PROJE_PLANI.md) · Çalışma kuralları: [CLAUDE.md](CLAUDE.md)

**Durum işaretleri:** ✅ tamamlandı · 🔄 devam ediyor · ⏳ bekliyor · ⛔ engelli (bağımlılık var) · 🔜 sıradaki

---

## 📍 Şu an neredeyiz?

| | |
|---|---|
| **Aktif faz** | Faz 0 — Analiz ve kurulum 🔄 |
| **Son güncelleme** | 11.10.2026 |
| **Sıradaki iş** | ⛔ PostgreSQL + Node.js kurulumu (kullanıcı) → ilk migration + testlerin PostgreSQL'de çalıştırılması → Faz 1 |
| **Engeller** | Bilgisayarda PostgreSQL, Node.js ve Docker yok (bkz. Faz 0 → F0-09, F0-10) |

---

## Faz Özeti

| Faz | Başlık | Tahmini süre | Durum |
|---|---|---|---|
| 0 | Analiz ve kurulum | 1 hafta | 🔄 |
| 1 | Çekirdek altyapı + admin iskeleti | 2 hafta | ⏳ |
| 2 | Katalog yönetimi (admin) | 2 hafta | ⏳ |
| 3 | Vitrin | 2 hafta | ⏳ |
| 4 | Üyelik ve Hesabım | 2 hafta | ⏳ |
| 5 | Sepet, sipariş, ödeme | 3 hafta | ⏳ |
| 6 | Pazarlama, kampanya motoru, yorumlar | 3 hafta | ⏳ |
| 7 | Blog, içerik, test, güvenlik, yayın | 2 hafta | ⏳ |
| 8 | v1 sonrası: kargo API, e-fatura, SMS OTP | — | ⏳ |

---

## Faz 0 — Analiz ve kurulum 🔄

| ID | Görev | Durum | Not |
|---|---|---|---|
| F0-01 | Gereksinim analizi ve proje planı | ✅ | PROJE_PLANI.md v1.1 |
| F0-02 | Referans site analizi (ana sayfa, kategori, ürün, sepet, ödeme, üye ol/giriş) | ✅ | PROJE_PLANI.md §11 |
| F0-03 | Teknoloji kararları (Laravel 13, çoklu ödeme, kup ölçüsü, yorum kuralı) | ✅ | PROJE_PLANI.md "Alınan kararlar" |
| F0-04 | Laravel 13.35 iskeleti | ✅ | PHP 8.4.11 |
| F0-05 | Temel ayarlar: TR dil, Europe/Istanbul, Argon2id, PostgreSQL, güvenli oturum çerezi | ✅ | `.env.example`, `config/` |
| F0-06 | Kod kalitesi: Pint (strict_types), Larastan seviye 8, composer `check` scripti | ✅ | `composer check` |
| F0-07 | Ön yüz: Tailwind kaldırıldı → Bootstrap 5.3 + SCSS + Bootstrap Icons + SortableJS, vitrin/admin ayrı paketler, CSRF'li `http.js` | ✅ | `npm install` bekliyor |
| F0-08 | Docker: nginx + php-fpm 8.4 + PostgreSQL 16 + Mailpit, citext/pg_trgm/unaccent eklentileri | ✅ | `docker-compose.yml` |
| F0-09 | **PostgreSQL 16 kurulumu** (veya Docker Desktop) | ⛔ | Kullanıcı kuracak — README §Kurulum |
| F0-10 | **Node.js 22 LTS kurulumu** + `npm install` + `npm run build` | ⛔ | Kullanıcı kuracak |
| F0-11 | CI hattı (GitHub Actions): Pint, Larastan, PHPUnit (PostgreSQL), composer audit, npm build | ✅ | `.github/workflows/ci.yml` — repo bağlanınca çalışır |
| F0-12 | Proje takip belgeleri: YOL_HARITASI.md, CLAUDE.md, README.md, ADR'ler | ✅ | |
| F0-13 | Git deposu oluşturuldu (commit YOK) | ✅ | **Kullanıcı kararı: commit atılmayacak** — commit/push yalnızca kullanıcı açıkça isterse |
| F0-14 | İlk migration + Feature testlerinin PostgreSQL'de geçmesi | ⛔ | F0-09'a bağlı |
| F0-15 | Wireframe'ler (vitrin + admin ana ekranlar) | ⏳ | Referans site düzeni temel alınacak; marka kimliği bekleniyor |

**Faz 0 kabul kriteri:** `composer check` yeşil, `npm run build` başarılı, `php artisan migrate` PostgreSQL'de çalışıyor, ana sayfa açılıyor.

---

## Faz 1 — Çekirdek altyapı + admin iskeleti ⏳

| ID | Görev | Durum |
|---|---|---|
| F1-01 | `SecurityHeaders` middleware: CSP (nonce'lu), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy + testleri | ⏳ |
| F1-02 | Türkçe dil dosyaları (doğrulama mesajları, sayfalama, şifre) | ⏳ |
| F1-03 | Özel hata sayfaları (403, 404, 419, 429, 500, 503) — iç bilgi sızdırmadan | ⏳ |
| F1-04 | Loglama: günlük dosya, hassas alan maskeleme (şifre, kart, token) | ⏳ |
| F1-05 | `admins` tablosu + `admin` guard + ayrı oturum çerezi + `ADMIN_PATH` | ⏳ |
| F1-06 | Admin giriş/çıkış, throttle (5 deneme/dk), oturum yenileme | ⏳ |
| F1-07 | Zorunlu 2FA (TOTP, QR kod, kurtarma kodları) | ⏳ |
| F1-08 | Rol/izin (spatie/laravel-permission): Süper Admin, Katalog, Sipariş, İçerik rolleri | ⏳ |
| F1-09 | İşlem kaydı (spatie/laravel-activitylog) | ⏳ |
| F1-10 | Admin layout (sidebar, üst bar, breadcrumb, flash mesajlar, onay modalı) | ⏳ |
| F1-11 | `settings` altyapısı (önbellekli, şifreli alanlar destekli) + Genel Ayarlar ekranı | ⏳ |
| F1-12 | Admin kullanıcı yönetimi ekranı | ⏳ |
| F1-13 | İlk süper admin oluşturma komutu (`php artisan admin:create`) | ⏳ |

---

## Faz 2 — Katalog yönetimi (admin) ⏳

| ID | Görev | Durum |
|---|---|---|
| F2-01 | Kategoriler: sınırsız seviye ağaç, sürükle-bırak sıralama, SEO alanları | ⏳ |
| F2-02 | Renkler, ürün türleri, **seçenek grupları** (Beden, Kup Ölçüsü…) ve değerleri | ⏳ |
| F2-03 | Beden / kup ölçü tabloları | ⏳ |
| F2-04 | Ürün CRUD (taslak/yayın, çoklu kategori, SEO, açıklama — HTMLPurifier) | ⏳ |
| F2-05 | Varyant matrisi (renk × beden/kup → SKU, stok, fiyat) | ⏳ |
| F2-06 | Çoklu görsel yükleme: sürükle-bırak, sıralama, kapak, varyanta bağlama, WebP + boyutlar, EXIF temizleme | ⏳ |
| F2-07 | Fiyat ve indirim (yüzde/tutar, tarih aralığı), `price_history` | ⏳ |
| F2-08 | Toplu fiyat/stok güncelleme (kategori bazlı %, tutar) | ⏳ |
| F2-09 | Excel/CSV içe-dışa aktarma (önizleme + onay) | ⏳ |
| F2-10 | Stok hareketleri ve kritik stok uyarısı | ⏳ |
| F2-11 | `PricingService` (birim testleri %90+) | ⏳ |

## Faz 3 — Vitrin ⏳

| ID | Görev | Durum |
|---|---|---|
| F3-01 | Ana layout: kampanya şeridi + geri sayım, kayan duyuru, header, offcanvas mega menü, footer | ⏳ |
| F3-02 | Ana sayfa blokları (banner, flaş, çok satan, yeni gelenler — admin'den sıralanabilir) | ⏳ |
| F3-03 | Ürün kartı bileşeni (indirim %, eski/yeni fiyat, kampanya etiketi, TÜKENDİ, favori, hover 2. görsel) | ⏳ |
| F3-04 | Kategori sayfası: alt kategori çipleri, filtre paneli, sıralama, ürün sayısı, sayfalama | ⏳ |
| F3-05 | Arama (pg_trgm + unaccent, otomatik tamamlama) | ⏳ |
| F3-06 | Ürün detay: galeri, varyant/kup seçimi (stok yoksa çizili), beden tablosu, son 30 gün en düşük fiyat, sepette fiyat, kargo sayacı, sekmeler | ⏳ |
| F3-07 | Gezdiğiniz ürünler paneli | ⏳ |
| F3-08 | SEO: slug, meta, sitemap.xml, robots.txt, Schema.org, canonical | ⏳ |

## Faz 4 — Üyelik ve Hesabım ⏳

| ID | Görev | Durum |
|---|---|---|
| F4-01 | Kayıt (ad, soyad, e-posta, telefon +90, şifre; ayrı ve **işaretsiz** onay kutuları) | ⏳ |
| F4-02 | Giriş, şifremi unuttum, e-posta doğrulama, throttle | ⏳ |
| F4-03 | Google / Facebook (Socialite), hesap bağlama, eksik telefonu tamamlatma | ⏳ |
| F4-04 | Hesabım: profil, şifre, adresler (il/ilçe), bağlı hesaplar | ⏳ |
| F4-05 | Favoriler, istek listesi, fiyat alarmı | ⏳ |
| F4-06 | KVKK: verilerimi indir, hesabımı sil | ⏳ |

## Faz 5 — Sepet, sipariş, ödeme ⏳

| ID | Görev | Durum |
|---|---|---|
| F5-01 | Sepet (misafir + üye, girişte birleştirme), mini sepet, ücretsiz kargo ilerleme bandı | ⏳ |
| F5-02 | Tek sayfa checkout: misafir/üye, adres (il/ilçe), bireysel/kurumsal fatura, sözleşme onayları | ⏳ |
| F5-03 | Sipariş oluşturma + stok rezervasyonu (atomik, yarış durumu testleri) | ⏳ |
| F5-04 | `PaymentGateway` arayüzü + `PaymentManager` + admin Ödeme Ayarları ekranı (şifreli bilgiler, test/canlı, taksit tablosu, bağlantı testi) | ⏳ |
| F5-05 | iyzico adapter (Checkout Form / 3DS) | ⏳ |
| F5-06 | PayTR adapter (iFrame API) | ⏳ |
| F5-07 | Garanti BBVA sanal POS adapter (3D Pay Hosting) | ⏳ |
| F5-08 | Akbank sanal POS adapter (3D Pay Hosting) | ⏳ |
| F5-09 | Callback: imza + tutar doğrulama, idempotency, zaman aşımı iptali (zamanlanmış görev) | ⏳ |
| F5-10 | İade / iptal (admin'den, banka API ile) | ⏳ |
| F5-11 | Sipariş e-postaları, misafir sipariş takip sayfası | ⏳ |
| F5-12 | Hesabım → Siparişlerim, sipariş detayı, satın aldığım ürünler | ⏳ |
| F5-13 | Admin sipariş yönetimi (durum, kargo takip no, not, yazdırma) | ⏳ |

## Faz 6 — Pazarlama, kampanya motoru, yorumlar ⏳

| ID | Görev | Durum |
|---|---|---|
| F6-01 | Bannerlar (masaüstü/mobil, konum, tarih aralığı) | ⏳ |
| F6-02 | Koleksiyonlar: flaş ürünler (flaş fiyat, geri sayım), çok satanlar (otomatik), manuel koleksiyonlar | ⏳ |
| F6-03 | Kampanya motoru: X Al Y Öde, Bir Alana Bir Bedava, kategoriye sepette %, ücretsiz kargo eşiği, hediye ürün | ⏳ |
| F6-04 | Kupon / hediye çeki | ⏳ |
| F6-05 | Duyuru şeridi, popup yönetimi, menü yönetimi | ⏳ |
| F6-06 | Yorumlar: yalnızca teslim edilmiş siparişteki ürün, puan + yorum, admin onayı/yanıtı | ⏳ |
| F6-07 | Dashboard grafikleri (satış, sipariş, kritik stok, bekleyen yorumlar) | ⏳ |
| F6-08 | Sosyal kanıt sayaçları (gerçek verilerden) | ⏳ |

## Faz 7 — İçerik, test, güvenlik, yayın ⏳

| ID | Görev | Durum |
|---|---|---|
| F7-01 | Statik sayfalar (KVKK, ETK, mesafeli satış, iade, SSS, iletişim), çerez onay bandı | ⏳ |
| F7-02 | Blog modülü | ⏳ |
| F7-03 | Uçtan uca testler (kayıt → sepet → ödeme → yorum) | ⏳ |
| F7-04 | OWASP ZAP taraması + bağımsız pentest + bulguların kapatılması | ⏳ |
| F7-05 | Performans: önbellek, sorgu/indeks, görsel optimizasyonu, Lighthouse ≥ 90 | ⏳ |
| F7-06 | Canlı ortam: sunucu, SSL, yedekleme, izleme, kuyruk işçisi, cron | ⏳ |

---

## Çalışma Günlüğü

> En yeni kayıt en üstte. Her oturum sonunda: ne yapıldı, ne karar alındı, sıradaki adım.

### 11.10.2026 — Oturum 2
- **Kararlar:** Laravel 13; ödeme iyzico + PayTR + Akbank + Garanti (çoklu); varyantlarda sütyen kup ölçüsü; yorumlar yalnızca satın alanlar; kargo/e-fatura/SMS v1 sonrası.
- Referans sitenin sepet, ödeme, üye ol ve giriş ekranları incelendi → PROJE_PLANI.md §11.8. (Ödeme adımında bilgi girilmedi; Hesabım giriş gerektirdiği için incelenmedi.)
- Plan v1.1: Laravel mimarisi, paket listesi, seçenek grubu (kup ölçüsü) veri modeli, Laravel `encrypted` cast ile şifreleme (sunucuda sodium eklentisi yok).
- Faz 0 kurulumu: Laravel 13.35 iskeleti, ayarlar, Bootstrap/Vite, Docker, CI, Pint + Larastan (seviye 8 — hata yok), takip belgeleri.
- **Ortam tespiti:** PHP 8.4.11 (pdo_pgsql ✓, intl ✓, gd ✓; sqlite ✗, sodium ✗), Composer 2.9.7, Git 2.51 var; **PostgreSQL, Node.js, Docker yok**.
- **Sıradaki:** Kullanıcı PostgreSQL + Node.js kurar → `php artisan migrate`, `composer check`, `npm run build` → Faz 1 (F1-01'den başla).

### 10.10.2026 — Oturum 1
- İlk proje planı hazırlandı (PROJE_PLANI.md v1.0).
- Referans site (lenahomewears.com) ana sayfa, kategori ve ürün detay sayfaları incelendi.
