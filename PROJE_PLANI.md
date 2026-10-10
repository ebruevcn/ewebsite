# E-Ticaret Platformu — Proje Planı

> Teknoloji: **PHP 8.4 + Laravel 13, PostgreSQL 16, Bootstrap 5.3, Vanilla JS (ES Modules), Vite**
> Belge sürümü: v1.1 — 11.10.2026 · İlerleme takibi: [YOL_HARITASI.md](YOL_HARITASI.md)

### Alınan kararlar (11.10.2026)
| # | Konu | Karar |
|---|---|---|
| K1 | Altyapı | **Laravel 13** (özel MVC yerine) |
| K2 | Ödeme | **Çoklu sağlayıcı**: iyzico, PayTR, Akbank, Garanti BBVA (+ adapter ile ileride diğer bankalar). Admin hangisinin aktif/varsayılan olduğunu seçer |
| K3 | Varyantlar | Renk + beden + **sütyen kup ölçüsü** (75A, 80B, 85C…) → genel "seçenek grubu" yapısı |
| K4 | Yorumlar | Yalnızca ürünü **satın almış ve siparişi teslim edilmiş** üyeler |
| K5 | Ek entegrasyonlar | Kargo API, e-fatura, SMS doğrulama **v1 sonrası** |

---

## 1. Proje Kapsamı

| Alan | Kapsam |
|---|---|
| **Vitrin (müşteri tarafı)** | Ana sayfa (banner, flaş ürünler, çok satanlar), kategori/alt kategori listeleme, filtreleme, arama, ürün detayı (çoklu fotoğraf, varyant seçimi, yorumlar), sepet, ödeme (üyeli veya misafir), hesabım |
| **Üyelik** | E-posta (ad, soyad, telefon, e-posta, şifre), Google ile giriş, Facebook ile giriş, e-posta doğrulama, şifre sıfırlama |
| **Hesabım** | Geçmiş siparişler, sipariş detayı/durumu, satın alınan ürünler, adresler, yorumlarım, profil ve şifre |
| **Yorumlar** | Yalnızca üyeler; puan (1–5) + yorum; admin onayı; "satın aldı" rozeti |
| **Admin paneli** | Ürün, kategori, varyant (renk/tür), fotoğraf, fiyat/indirim/iskonto, stok, toplu fiyat güncelleme, banner, koleksiyon (flaş, çok satan vb.), siparişler, müşteriler, yorum moderasyonu, kuponlar, **banka/ödeme API ayarları**, site ayarları, admin kullanıcıları ve yetkiler, işlem kayıtları |
| **Ödeme** | Kredi/banka kartı, 3D Secure zorunlu, taksit desteği, üyeli + misafir alışveriş |

**Kapsam dışı (v1 sonrası önerilir):** Kargo firması entegrasyonu, e-fatura/e-arşiv, çoklu dil/para birimi, pazaryeri entegrasyonları, mobil uygulama.

---

## 2. Mimari Kararlar

### 2.1 Uygulama yapısı (Laravel 13)
Katmanlı mimari — Laravel'in sağladığı altyapı üzerine iş kuralları ayrı katmanda:

```
Request → Route → Middleware (güvenlik başlıkları, oturum, CSRF, throttle, yetki, 2FA)
        → FormRequest (doğrulama + yetki) → Controller (ince)
        → Action / Service (iş kuralları, DB transaction) → Eloquent Model / Query Builder
        → Blade (Bootstrap) / JSON Resource (AJAX uçları)
```

- **Controller** ince tutulur; iş kuralları (fiyat hesaplama, kampanya, stok düşme, sipariş oluşturma) `app/Services` ve tek amaçlı `app/Actions` sınıflarındadır.
- Veritabanı erişimi Eloquent / Query Builder ile — her zaman parametreli sorgu; ham SQL yalnızca `DB::select('... ?', [$x])` biçiminde.
- Yetkilendirme: **Policy** sınıfları (sipariş, adres, yorum sahipliği) + admin için rol/izin **Gate**'leri.
- Para hesapları `brick/money` ile (float yok); tutarlar DB'de `NUMERIC(12,2)`.
- Ödeme sağlayıcıları **Strategy/Adapter** deseni: `PaymentGateway` arayüzü + `PaymentManager` → yeni banka = yeni sınıf.
- Uzun süren işler (e-posta, görsel işleme, çok satan hesaplama) **Queue** ile arka planda.
- Admin ve vitrin ayrı **guard** kullanır (`web` / `admin`), ayrı oturum çerezi.

### 2.2 Dizin yapısı

```
proje/
├── app/
│   ├── Actions/              # Tek amaçlı iş adımları (PlaceOrder, ApplyCoupon, AdjustStock...)
│   ├── Enums/                # OrderStatus, PaymentStatus, DiscountType, CampaignType...
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Front/        # Vitrin
│   │   │   ├── Account/      # Hesabım
│   │   │   ├── Admin/        # Yönetim paneli
│   │   │   └── Payment/      # Banka callback/webhook uçları
│   │   ├── Middleware/       # SecurityHeaders, EnsureAdminTwoFactor...
│   │   └── Requests/         # FormRequest doğrulamaları
│   ├── Models/
│   ├── Policies/
│   ├── Services/
│   │   ├── Pricing/          # PricingService, CampaignEngine
│   │   ├── Cart/  Order/  Stock/  Media/
│   │   └── Payment/
│   │       ├── Contracts/PaymentGateway.php
│   │       ├── Gateways/     # IyzicoGateway, PaytrGateway, AkbankGateway, GarantiGateway
│   │       └── PaymentManager.php
│   └── Support/              # Yardımcılar (Türkçe slug, para formatı...)
├── database/  migrations/ factories/ seeders/
├── resources/
│   ├── scss/                 # front.scss, admin.scss, _variables.scss (marka teması)
│   ├── js/                   # front.js, admin.js, http.js (CSRF'li fetch), modüller
│   └── views/  layouts/ front/ account/ admin/ emails/ components/
├── routes/  web.php  admin.php  payment.php
├── tests/   Unit/ Feature/
├── docker/  php/ nginx/ postgres/
├── docs/adr/                 # Mimari karar kayıtları
├── PROJE_PLANI.md  YOL_HARITASI.md  CLAUDE.md  README.md
```

### 2.3 Paketler

| Amaç | Paket | Faz |
|---|---|---|
| Çatı | `laravel/framework` 13 | 0 ✅ |
| Kod stili / statik analiz | `laravel/pint`, `larastan/larastan` (seviye 8) | 0 ✅ |
| Sosyal giriş | `laravel/socialite` (Google, Facebook) | 4 |
| Admin 2FA | `pragmarx/google2fa-laravel` + `bacon/bacon-qr-code` | 1 |
| Rol / izin | `spatie/laravel-permission` | 1 |
| İşlem kaydı | `spatie/laravel-activitylog` | 1 |
| Görsel işleme | `intervention/image` (yeniden kodlama, WebP, boyutlar) | 2 |
| HTML temizleme | `mews/purifier` (HTMLPurifier) | 2 |
| Para hesabı | `brick/money` | 2 |
| Excel/CSV içe-dışa aktarım | `openspout/openspout` | 2 |
| Ödeme | `iyzico/iyzipay-php`; PayTR / Akbank / Garanti için kendi HTTP adapter'larımız (Laravel HTTP Client) | 5 |
| Test | PHPUnit 12 | 0 ✅ |

### 2.4 Ön yüz
- **Bootstrap 5.3** (SCSS ile özelleştirilmiş tema), **Bootstrap Icons**
- **Vanilla JS (ES Modules)**: sepet işlemleri, varyant seçimi, galeri, filtreleme, admin'de sürükle-bırak görsel yükleme ve sıralama
- Admin'de: **SortableJS** (sıralama), **Chart.js** (dashboard grafikleri), zengin metin editörü (TinyMCE/Quill — çıktı sunucuda HTMLPurifier'dan geçer)
- Mobil öncelikli (mobile-first) tasarım, erişilebilirlik (WCAG 2.1 AA hedefi), lazy-load görseller

---

## 3. Veritabanı Tasarımı (PostgreSQL)

Para alanları `NUMERIC(12,2)`, zaman alanları `TIMESTAMPTZ`, esnek veriler `JSONB`.

### 3.1 Kullanıcılar ve kimlik doğrulama
| Tablo | Önemli alanlar |
|---|---|
| `users` | id, first_name, last_name, email (UNIQUE, CITEXT), phone, password_hash (NULL olabilir — sosyal girişte), email_verified_at, status, kvkk_consent_at, marketing_consent, created_at |
| `social_accounts` | user_id, provider (google/facebook), provider_user_id, UNIQUE(provider, provider_user_id) |
| `user_addresses` | user_id, title, full_name, phone, city, district, address_line, postal_code, is_default, type (shipping/billing), tax_no, company |
| `auth_tokens` | user_id, type (email_verify / password_reset / remember), token_hash (SHA-256), expires_at, used_at |
| `login_attempts` | identifier, ip, attempted_at, success — kaba kuvvet koruması |
| `admins` | ayrı tablo + ayrı `admin` guard; email, password, two_factor_secret (şifreli), two_factor_confirmed_at, last_login_at, last_login_ip, is_active |
| `roles`, `permissions`, … | `spatie/laravel-permission` tabloları — admin yetkilendirme (örn. sadece sipariş görebilen personel) |

### 3.2 Katalog
| Tablo | Önemli alanlar |
|---|---|
| `categories` | id, **parent_id** (kendine referans → sınırsız alt kategori), name, slug (UNIQUE), description, image, sort_order, is_active, seo_title, seo_description |
| `product_types` | Ürün türleri (admin tarafından dinamik) |
| `colors` | name, hex_code (admin tarafından dinamik) |
| `products` | id, title, slug, short_description, description, product_type_id, brand, **base_price**, **discount_type** (none/percent/amount), **discount_value**, discount_starts_at, discount_ends_at, vat_rate, status (draft/active/passive), is_featured, search_vector (tsvector), created_at, updated_at |
| `product_categories` | product_id, category_id (bir ürün birden fazla kategoride olabilir) |
| `option_groups` | Seçenek grupları (admin tarafından dinamik): "Beden" (S, M, L, XL), "**Kup Ölçüsü**" (75A, 75B, 80B, 85C…), "Saten Bedeni", "Bralet Bedeni"… · name, display_type (buton/renk kutusu/açılır liste), size_chart_id |
| `option_values` | option_group_id, value ("80B"), sort_order |
| `product_variants` | id, product_id, sku (UNIQUE), color_id, barcode, **price_override** (NULL ise ürün fiyatı), **stock_quantity** (CHECK ≥ 0), is_active |
| `variant_option_values` | variant_id, option_value_id — bir varyant birden fazla seçeneğe bağlanabilir (ör. Siyah + 80B). Stokta olmayan seçenek vitrinde çizili gösterilir |
| `size_charts` | Beden / kup ölçü tablosu (HTML tablo veya görsel), kategoriye veya seçenek grubuna bağlanır |
| `product_images` | product_id, variant_id (NULL olabilir — renk bazlı galeri), path, alt_text, sort_order, is_cover |
| `price_history` | product_id/variant_id, old_price, new_price, changed_by (admin), reason, created_at |
| `stock_movements` | variant_id, change (+/-), reason (sipariş/iade/manuel), reference_id, admin_id, created_at |

### 3.3 Pazarlama
| Tablo | Önemli alanlar |
|---|---|
| `collections` | name ("Flaş Ürünler", "Çok Satanlar", "Yeni Gelenler"...), slug, type (**manual** / **auto_bestseller** / **flash**), starts_at, ends_at, is_active, show_on_homepage, sort_order |
| `collection_products` | collection_id, product_id, sort_order, **flash_price** (flaş indirimli fiyat), flash_stock_limit |
| `banners` | title, image_desktop, image_mobile, link_url, position (home_slider / home_middle / category_top...), starts_at, ends_at, sort_order, is_active |
| `coupons` | code (UNIQUE), type (percent/amount/free_shipping), value, min_cart_total, max_discount, usage_limit, per_user_limit, starts_at, ends_at |
| `coupon_usages` | coupon_id, user_id/email, order_id |

> **Çok Satanlar** otomatik modda: son N gün `order_items` satış adedine göre materialized view veya zamanlanmış görevle (cron) hesaplanır; admin elle de sabitleyebilir.

### 3.4 Sepet, sipariş, ödeme
| Tablo | Önemli alanlar |
|---|---|
| `carts` | id (UUID), user_id (NULL — misafir), session_token_hash, expires_at |
| `cart_items` | cart_id, variant_id, quantity |
| `orders` | id, **order_no** (tahmin edilemez, örn. `ET-2026-8F3K2Q`), user_id (NULL — misafir), guest_email, guest_phone, **shipping_address (JSONB anlık kopya)**, billing_address (JSONB), subtotal, discount_total, coupon_discount, shipping_fee, vat_total, grand_total, status, payment_status, guest_access_token_hash, created_at |
| `order_items` | order_id, product_id, variant_id, **title_snapshot, sku_snapshot, color_snapshot, unit_price_snapshot**, quantity, line_total |
| `order_status_history` | order_id, from_status, to_status, note, admin_id, created_at |
| `payments` | order_id, provider_code, provider_transaction_id, amount, currency, installment, status (pending/success/failed/refunded), card_last4, card_brand, error_code, error_message, raw_response (maskelenmiş JSONB), idempotency_key (UNIQUE), created_at |
| `refunds` | payment_id, amount, reason, provider_ref, admin_id, status |

### 3.5 Yorumlar ve sistem
| Tablo | Önemli alanlar |
|---|---|
| `reviews` | product_id, user_id, **order_item_id (zorunlu — yalnızca teslim edilmiş siparişteki ürün için yorum yazılabilir)**, rating (CHECK 1–5), title, comment, status (pending/approved/rejected), admin_reply, UNIQUE(user_id, product_id) |
| `payment_providers` | code, display_name, is_active, is_default, **mode (test/live)**, **credentials (Laravel `encrypted:array` cast — AES-256 + HMAC, anahtar APP_KEY)**, installment_config (JSONB), commission_rates (JSONB), sort_order |
| `settings` | key, value (JSONB) — site adı, logo, iletişim, kargo ücreti, ücretsiz kargo limiti, SMTP, OAuth anahtarları (şifreli) |
| `audit_logs` | admin_id, action, entity, entity_id, old_values, new_values (JSONB), ip, user_agent, created_at |
| `pages` | KVKK, mesafeli satış sözleşmesi, iade politikası, hakkımızda (admin düzenler) |

### 3.6 İndeksler ve arama
- `pg_trgm` + `unaccent` eklentileri; Türkçe tam metin arama için `products.search_vector` (GIN indeks)
- `categories(parent_id)`, `products(status, created_at)`, `product_variants(product_id)`, `orders(user_id, created_at)`, `reviews(product_id, status)` indeksleri
- Kategori ağacı için `WITH RECURSIVE` sorgular (alt kategorideki ürünler üst kategoride de listelenir)

---

## 4. Fiyat, İndirim ve İskonto Kuralları

Tüm hesaplamalar **sunucuda** `PricingService` içinde yapılır; tarayıcıdan gelen fiyat **asla** kullanılmaz.

```
1. Liste fiyatı         = variant.price_override ?? product.base_price
2. Ürün indirimi        = discount_type (yüzde / sabit tutar), tarih aralığında geçerliyse
3. Flaş fiyat           = aktif flaş koleksiyonunda ise flash_price (2'den düşükse uygulanır)
4. Satış fiyatı         = max(0, sonuç)  → üstü çizili eski fiyat + yeni fiyat gösterilir
5. Sepet iskontosu      = kupon / sepet tutarına göre iskonto (min. tutar, maks. indirim)
6. Kargo                = ücretsiz kargo limiti kontrolü
7. KDV                  = fiyatlar KDV dahil girilir, faturada KDV ayrıştırılır
```

**Admin toplu fiyat güncelleme:**
- Seçili ürünlere / bir kategoriye (alt kategoriler dahil) **% veya tutar** zam/indirim
- CSV/Excel ile içe aktarma (SKU, fiyat, stok) — önizleme ekranı + onay
- Her değişiklik `price_history` ve `audit_logs` tablosuna yazılır, geri alınabilir

---

## 5. Ödeme Altyapısı ve Banka API Entegrasyonu

### 5.1 PCI DSS yaklaşımı (kritik)
Kart verisinin **bizim sunucumuzda hiç işlenmemesi/saklanmaması** hedeflenir:

| Yöntem | Açıklama | PCI kapsamı |
|---|---|---|
| **Önerilen:** Ödeme kuruluşu (**v1: iyzico, PayTR**; sonra Param, Sipay) iframe/ortak ödeme sayfası | Kart formu sağlayıcıda; biz sadece token/sonuç alırız | En düşük (SAQ-A) |
| Banka sanal POS — **3D Pay Hosting / Ortak Ödeme Sayfası** | **v1: Garanti BBVA, Akbank**; sonra İş Bankası, Ziraat, Halkbank (NestPay/Payten), YKB (Posnet), QNB, Denizbank, VakıfBank, İş Bankası, Ziraat, Halkbank (NestPay/Payten), YKB (Posnet), QNB, Denizbank, VakıfBank | Düşük |
| Banka sanal POS — 3D Model (kart formu bizim sitemizde) | Kart bilgisi sunucumuzdan geçer | Yüksek (SAQ-D, yıllık denetim) — **önerilmez** |

Kart numarası, CVV veya son kullanma tarihi **hiçbir koşulda** veritabanına/loga yazılmaz; yalnızca son 4 hane ve kart markası saklanır.

### 5.2 Admin paneli — Ödeme Ayarları ekranı
- Sağlayıcı listesi: aktif/pasif, varsayılan, sıralama
- Her sağlayıcı için dinamik form: Merchant ID, Terminal ID, API Key, Secret Key, Store Key, Kullanıcı adı/şifre, 3D gateway URL
- **Test / Canlı mod** anahtarı (iki ayrı bilgi seti)
- Taksit tablosu ve vade farkı oranları (kart ailesine göre: Bonus, World, Maximum, Axess, CardFinans, Paraf...)
- "Bağlantıyı Test Et" butonu
- Gizli alanlar kaydedildikten sonra **maskeli** gösterilir (`••••••3f9a`), sadece yeniden girilerek değiştirilir
- Bilgiler Laravel `encrypted` cast ile (AES-256 + HMAC) şifrelenir; anahtar `.env` dosyasındaki `APP_KEY`, veritabanında değil. Anahtar rotasyonu için `APP_PREVIOUS_KEYS` kullanılır
- Ayar değişiklikleri 2FA doğrulaması ister ve `audit_logs`'a yazılır

### 5.3 Ödeme akışı

```
Sepet → Checkout (adres + sözleşme onayları) → Sipariş "pending" oluşturulur
  → Stok rezerve edilir (SELECT ... FOR UPDATE / atomik UPDATE)
  → PaymentManager → seçili Gateway → 3D Secure sayfası
  → Banka callback (POST) → hash/imza doğrulama + tutar doğrulama + idempotency kontrolü
  → Başarılı: sipariş "paid", stok kesinleşir, e-posta gönderilir
  → Başarısız: rezerv serbest bırakılır, kullanıcı tekrar deneyebilir
  → Zaman aşımı (örn. 30 dk) dolan bekleyen siparişler cron ile iptal edilir
```

### 5.4 `App\Services\Payment\Contracts\PaymentGateway`
```php
interface PaymentGateway {
    public function initialize(Order $order, PaymentRequest $req): PaymentInitResult; // 3D form/iframe
    public function handleCallback(array $payload): PaymentResult;                   // imza doğrulama
    public function refund(Payment $payment, string $amount): RefundResult;
    public function cancel(Payment $payment): RefundResult;
    public function getInstallments(string $binNumber, string $amount): array;
    public function testConnection(): bool;
}
```

---

## 6. Kimlik Doğrulama ve Üyelik

| Konu | Uygulama |
|---|---|
| E-posta ile kayıt | Ad, soyad, telefon (TR format doğrulama), e-posta, şifre (min. 10 karakter, sızdırılmış şifre kontrolü opsiyonel), KVKK aydınlatma onayı, ticari ileti izni (ayrı onay kutusu) |
| Şifre saklama | Laravel Hash — **Argon2id** (config/hashing.php varsayılanı) |
| E-posta doğrulama | Tek kullanımlık, süreli token (veritabanında hash olarak) |
| Google / Facebook | **Laravel Socialite** — OAuth 2.0 + `state` parametresi (CSRF); aynı doğrulanmış e-posta varsa hesap bağlama onayı; eksik bilgi (telefon) ilk girişte tamamlatılır |
| Oturum | Girişte `session()->regenerate()`, çıkışta `invalidate()`; oturum verisi şifreli (`SESSION_ENCRYPT=true`); çerezler `HttpOnly`, `Secure`, `SameSite=Lax`; boşta kalma zaman aşımı |
| Beni hatırla | Laravel remember token (şifre değişince tüm oturumlar düşürülür — `logoutOtherDevices`) |
| Kaba kuvvet | IP + hesap bazlı rate limit, artan bekleme süresi, çok denemede CAPTCHA (Cloudflare Turnstile / reCAPTCHA) |
| Misafir alışveriş | E-posta + telefon zorunlu; sipariş takibi için e-postaya tek kullanımlık güvenli link; sonradan "hesap oluştur" ile siparişleri bağlama |
| Admin girişi | Ayrı oturum alanı, **zorunlu 2FA (TOTP)**, opsiyonel IP kısıtlaması, tahmin edilmesi zor admin yolu |

---

## 7. Güvenlik Planı (OWASP Top 10 – 2021 eşlemesi)

> Dürüst not: Hiçbir yazılım için "sıfır açık" garanti edilemez. Hedef; **katmanlı savunma (defense in depth)**, güvenli kodlama standartları, otomatik taramalar ve yayın öncesi bağımsız **sızma testi (pentest)** ile riski en aza indirmektir.

| Risk | Önlem |
|---|---|
| **A01 Yetki kontrolü** | Her istekte yetki middleware'i; IDOR koruması (sipariş/adres/yorum sahiplik kontrolü `WHERE user_id = :current`); admin rol-izin matrisi; tahmin edilemez sipariş numaraları |
| **A02 Kriptografi** | HTTPS zorunlu + HSTS; Argon2id; hassas ayarlar libsodium ile şifreli; token'lar hash'li saklanır; `random_bytes()` |
| **A03 Enjeksiyon** | Yalnızca PDO prepared statements (`ATTR_EMULATE_PREPARES=false`); dinamik sıralama/sütun adları beyaz liste ile; XSS için tüm çıktılarda `htmlspecialchars` yardımcı fonksiyonu (`e()`), JS'e veri `json_encode` + `JSON_HEX_*` ile; zengin metin HTMLPurifier ile |
| **A04 Güvensiz tasarım** | Fiyat/indirim/stok sunucuda hesaplanır; stok yarış durumuna karşı atomik güncelleme; ödeme callback'inde tutar ve imza doğrulama; idempotency |
| **A05 Yanlış yapılandırma** | `display_errors=Off`, sadece `public/` web'e açık; güvenlik başlıkları: **CSP**, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; `expose_php=Off` |
| **A06 Bileşen açıkları** | `composer audit` CI'da; Dependabot; minimum bağımlılık |
| **A07 Kimlik doğrulama** | Rate limit, 2FA (admin), güvenli şifre sıfırlama, oturum sabitleme koruması, kullanıcı bulunamadı/şifre hatalı mesajlarının aynı olması |
| **A08 Veri bütünlüğü** | Ödeme webhook imza doğrulama; CSRF token (tüm POST/PUT/DELETE formları ve AJAX); SRI (CDN kullanılırsa) |
| **A09 Loglama** | Monolog; giriş denemeleri, admin işlemleri, ödeme olayları loglanır; loglarda kişisel veri/kart maskelenir; şüpheli olaylarda admin bildirimi |
| **A10 SSRF** | Sunucu tarafında kullanıcı URL'sine istek atılmaz; banka uç noktaları sabit beyaz listede |

**Dosya yükleme güvenliği:**
- MIME türü `finfo` ile doğrulanır (uzantıya güvenilmez), yalnızca JPEG/PNG/WebP
- Boyut ve piksel limiti; görsel **yeniden kodlanır** (gömülü zararlı içerik ve EXIF/GPS verisi silinir)
- Rastgele dosya adı; yükleme dizininde PHP yürütme nginx'te kapalı
- Otomatik WebP + farklı boyutlar (thumbnail, liste, detay, zoom)

**Yasal uyumluluk (Türkiye):**
- KVKK aydınlatma metni, açık rıza, çerez onay bandı (zorunlu / analitik / pazarlama ayrımı)
- Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu (ödeme öncesi onay, siparişe bağlı kopyası saklanır)
- İade/cayma hakkı (14 gün) süreci; ETBİS kaydı; İYS (ticari ileti) uyumu

---

## 8. Modül Listesi

### 8.1 Vitrin
- [ ] Ana sayfa: slider banner, orta bannerlar, flaş ürünler (geri sayım sayacı), çok satanlar, yeni gelenler, öne çıkan kategoriler
- [ ] Mega menü (dinamik kategori ağacı)
- [ ] Kategori sayfası: filtre (fiyat aralığı, renk, tür, indirimli, stokta), sıralama, sayfalama, breadcrumb
- [ ] Arama (otomatik tamamlama, Türkçe karakter toleransı)
- [ ] Ürün detay: galeri (zoom, mobilde kaydırma), renk/varyant seçimi → fiyat/stok/fotoğraf değişimi, stok uyarısı, taksit tablosu, yorumlar ve puan ortalaması, benzer ürünler
- [ ] Sepet (mini sepet + sepet sayfası), kupon uygulama
- [ ] Checkout: üye girişi / misafir devam, adres, kargo, sözleşme onayları, ödeme (3D)
- [ ] Sipariş sonuç sayfası + e-posta bildirimi
- [ ] Statik sayfalar, iletişim formu, 404/500 sayfaları
- [ ] SEO: dostu URL'ler (slug), meta etiketler, `sitemap.xml`, `robots.txt`, Schema.org (Product, Review, BreadcrumbList), canonical

### 8.2 Hesabım
- [ ] Profil ve şifre değişikliği, bağlı sosyal hesaplar
- [ ] Siparişlerim (liste, detay, durum geçmişi, fatura), satın aldığım ürünler
- [ ] Adreslerim
- [ ] Yorumlarım (sadece satın aldığı ürünlere yorum yazma — opsiyonel kural)
- [ ] Hesabı silme / verilerimi indir (KVKK)

### 8.3 Admin Paneli
- [ ] Dashboard: günlük/aylık satış, sipariş sayısı, kritik stok uyarıları, bekleyen yorumlar
- [ ] Ürünler: liste (filtre/arama), ekle/düzenle, çoklu fotoğraf (sürükle-bırak yükleme + sıralama + kapak seçimi), varyantlar (renk/beden/stok/SKU/fiyat), SEO alanları, taslak/yayın
- [ ] Toplu işlemler: fiyat güncelleme (%, tutar), indirim tanımlama, stok güncelleme, CSV içe/dışa aktarma
- [ ] Kategoriler: ağaç görünümü, sürükle-bırak sıralama, sınırsız alt kategori
- [ ] Renkler, ürün türleri (dinamik)
- [ ] Koleksiyonlar: Flaş ürünler (başlangıç-bitiş, flaş fiyat), Çok satanlar (otomatik/manuel), özel koleksiyonlar
- [ ] Bannerlar: masaüstü/mobil görsel, konum, link, yayın tarihi aralığı
- [ ] Siparişler: liste/filtre, detay, durum güncelleme (Hazırlanıyor → Kargoda → Teslim Edildi), kargo takip no, iptal/iade (banka API üzerinden), not ekleme, yazdırma
- [ ] Müşteriler: liste, detay, sipariş geçmişi, hesabı pasifleştirme
- [ ] Yorumlar: onay/ret/yanıt
- [ ] Kuponlar / iskontolar
- [ ] **Ödeme Ayarları (banka / ödeme kuruluşu API bilgileri)**
- [ ] Site ayarları: genel, logo, iletişim, kargo ücretleri, SMTP, Google/Facebook OAuth anahtarları, sosyal medya
- [ ] Sayfalar (KVKK, sözleşmeler)
- [ ] Admin kullanıcıları, roller ve izinler
- [ ] İşlem kayıtları (audit log)

---

## 9. Geliştirme Fazları (2 haftalık sprintler)

| Faz | Süre | İçerik | Teslim / Kabul kriteri |
|---|---|---|---|
| **0 — Analiz ve kurulum** | 1 hafta | Gereksinim netleştirme, wireframe'ler (vitrin + admin), Laravel 13 iskeleti, Docker ortamı (nginx, php-fpm 8.4, PostgreSQL 16, Mailpit), Git, CI hattı, kod standartları, proje takip belgeleri | `docker compose up` ile çalışan iskelet; CI yeşil |
| **1 — Çekirdek altyapı** | 2 hafta | Güvenlik başlıkları (CSP, HSTS), hata sayfaları, loglama, admin guard + giriş + zorunlu 2FA, rol/izin, işlem kaydı, admin panel iskeleti (layout, menü, dashboard), site ayarları altyapısı | Güvenlik middleware'leri birim testli; admin girişi çalışıyor |
| **2 — Katalog yönetimi (Admin)** | 2 hafta | Kategori ağacı, renk/tür, ürün CRUD, varyant, çoklu görsel yükleme, fiyat/indirim, toplu fiyat, stok, fiyat geçmişi | Admin tüm ürün verisini yönetebiliyor |
| **3 — Vitrin** | 2 hafta | Ana sayfa, mega menü, kategori listeleme + filtre, arama, ürün detayı, SEO | Ürünler sitede doğru fiyat/indirimle görünüyor |
| **4 — Üyelik** | 2 hafta | Kayıt/giriş, e-posta doğrulama, şifre sıfırlama, Google/Facebook girişi, hesabım, adresler | Üç yöntemle üye olunup giriş yapılabiliyor |
| **5 — Sepet, sipariş, ödeme** | 3 hafta | Sepet (misafir+üye, birleştirme), checkout, PricingService, stok rezervasyonu, ödeme adapter'ları, admin ödeme ayarları, callback, iade/iptal, e-postalar, sözleşmeler | Test kartlarıyla 3D ödeme uçtan uca başarılı; yarış durumu testleri geçiyor |
| **6 — Pazarlama ve etkileşim** | 2 hafta | Bannerlar, flaş ürünler (sayaç), çok satanlar (otomatik), kuponlar, yorumlar + moderasyon, sipariş yönetimi ekranları, dashboard | Admin kampanya kurgulayıp yayınlayabiliyor |
| **7 — Test, güvenlik, yayın** | 2 hafta | Uçtan uca testler, OWASP ZAP taraması, bağımsız pentest, performans (önbellek, indeks, görsel optimizasyon), KVKK kontrolü, canlı ortam kurulumu, yedekleme, izleme | Pentest kritik/yüksek bulgu yok; Lighthouse ≥ 90; canlıya çıkış |

**Toplam tahmini süre:** ~16 hafta (1 backend, 1 frontend, 0,5 QA ile). Tek geliştiriciyle 5–6 ay.

---

## 10. Kalite, Test ve DevOps

- **Kod standardı:** PSR-12, `declare(strict_types=1)`, PHPStan seviye 8
- **Testler:** PHPUnit birim testleri (PricingService, kupon, stok, imza doğrulama — %90+ kapsama), entegrasyon testleri (test veritabanı), uçtan uca kritik akışlar (kayıt → sepete ekle → ödeme)
- **CI (GitHub Actions / GitLab CI):** lint → PHPStan → PHPUnit → `composer audit` → build
- **Ortamlar:** local (Docker) → staging (test POS bilgileri) → production (canlı POS)
- **Sunucu:** Ubuntu LTS, nginx + PHP-FPM 8.3, PostgreSQL 16, Let's Encrypt SSL, UFW, fail2ban, opsiyonel Cloudflare (WAF + DDoS)
- **Yedekleme:** günlük `pg_dump` + görsellerin yedeği, sunucu dışı şifreli depolama, 30 gün saklama, aylık geri yükleme testi
- **Zamanlanmış görevler (cron):** bekleyen siparişleri iptal, çok satanları hesapla, süresi dolan sepet/token temizliği, flaş kampanya açma/kapama
- **İzleme:** hata logları, uptime izleme, ödeme hata oranı alarmı

---

## 11. Referans Site Analizi — lenahomewears.com

> Referans site **Ticimax** (hazır e-ticaret altyapısı, ASP.NET) üzerinde çalışıyor. Biz aynı **yapıyı ve işlevleri** PHP 8 + PostgreSQL ile sıfırdan kuracağız. Logo, marka adı, ürün fotoğrafları ve metinler referans siteden **kopyalanmayacak** (telif ve marka hakkı); kendi marka kimliğimizle doldurulacak.

### 11.1 Genel düzen (tüm sayfalar)
| Bileşen | Referanstaki karşılığı | Planımızdaki karşılığı |
|---|---|---|
| Üst kampanya şeridi + geri sayım | "Sezon Sonu – Yazlıklar Yarı Fiyatına · 1 GÜN 0 SA 9 DK" | `announcement_bars` tablosu: metin, renk, link, bitiş tarihi → JS geri sayım |
| Kayan duyuru bandı (marquee) | "1800 TL üzeri kargo ücretsiz", "3 Al 2 Öde"... | Aynı tabloda `type=marquee`, çoklu satır |
| Header | Hamburger menü + arama (sol), logo (orta), hesap + sepet (sağ) | Bootstrap offcanvas menü (mobil öncelikli) |
| Açılır kampanya popup'ı | "Kampanyalarımız" modalı | `popups` tablosu: içerik, gösterim sıklığı (oturumda 1 kez), sayfa hedefleme, tarih |
| Mega menü | Koleksiyonlar → Kampanyalar → Kategoriler (3 seviye) | Dinamik kategori ağacı + koleksiyonlar menüye bağlanabilir (`menus`, `menu_items`) |
| Güven rozetleri şeridi | Ücretsiz kargo · Güvenli ödeme · Gizli paketleme · Hızlı kargo | Admin'den düzenlenebilir ikon + başlık + açıklama blokları |
| SEO metin bloğu | "Devamını Göster" ile açılan uzun metin | Ana sayfa ve her kategori için `seo_content` alanı (HTMLPurifier'dan geçer) |
| Footer | Popüler kategoriler, Kurumsal sayfalar, Blog, SSL logosu | Menü yönetiminden beslenen footer |
| "Gezdiğiniz Ürünler" yan paneli | Sağda kayan sekme | Son görüntülenen ürünler (localStorage + üyede DB) |

### 11.2 Ana sayfa
- Kampanya banner'ları (yatay kaydırmalı kartlar)
- **Flaş Ürünler** karuseli — ürün kartında "FLAŞ İNDİRİM" rozeti, % indirim, eski/yeni fiyat, favori kalbi
- **Çok Satanlar** karuseli, **Yeni Gelenler** karuseli — her birinin "Tüm Ürünleri Gör" linki
- Ürün kartlarında kampanya etiketi ("Bir Alana Bir Bedava") ve "TÜKENDİ" etiketi
- → Planımızdaki `collections` + `banners` yapısı bunu karşılıyor; ana sayfa blokları admin'den **sıralanabilir** olacak (`homepage_sections`)

### 11.3 Kategori sayfası
- Başlık + "**425 Ürün bulundu**" + breadcrumb + kategori açıklaması
- **Alt kategori çipleri** (yatay kaydırmalı butonlar: Kısa Kollu, Uzun Kollu, Saten...)
- Filtreleme paneli (offcanvas): Stoktakiler, Yeni Ürünler, Ücretsiz Kargo, Fırsat Ürünleri, Hızlı Kargo, kategoriler, beden, renk, fiyat aralığı; **filtreyi kaydet** (üyeye özel)
- Sıralama: Fiyat artan/azalan, Ada göre A–Z / Z–A (+ biz ekleyeceğiz: en yeni, çok satan, en yüksek puan)
- Sonsuz kaydırma veya "Daha fazla yükle"
- 2 sütun (mobil) / 4 sütun (masaüstü) ürün ızgarası; ikinci fotoğraf hover'da

### 11.4 Ürün detay sayfası
- Sol: dikey küçük resim şeridi + büyük galeri (zoom, mobilde kaydırma)
- **"Son 30 Günün En Düşük Fiyatı"** ibaresi → `price_history` tablosundan hesaplanır (Ticaret Bakanlığı indirim yönetmeliğine uyum için de gerekli)
- % indirim rozeti, eski/yeni fiyat, **"Sepette %26 İndirimli Fiyatı: 2.589,99 TL"** → sepet kampanyası önizlemesi (`PricingService` ile)
- **Beden seçimi** (S/M/L/XL — stokta olmayan beden çizili) + **Beden Tablosu** modalı → varyant yapısı **renk + beden** olmalı
- Adet seçici, **Sepete Ekle** ve **Hemen Al** (doğrudan checkout)
- WhatsApp ile destek butonu
- Kargo bilgisi: "**X saat Y dakika içinde sipariş verirsen pazartesi kargoda**" → admin'deki kargo kesim saati + çalışma günlerinden hesaplanır
- Sosyal kanıt: "son gün X kişi inceledi", "son 3 günde X ürün satıldı", "X kişi favoriledi" → **bizde gerçek verilerden** hesaplanacak (uydurma sayılar Tüketici Kanunu'na göre yanıltıcı ticari uygulamadır)
- Favorilere Ekle · İstek Listeme Ekle · **Fiyat Düşünce Haber Ver** (e-posta bildirimi)
- Sekmeler: Ürün Özellikleri, Yorumlar (puan + yorum), Ödeme Seçenekleri (taksit tablosu), Yıkama ve Bakım, Kargo Seçenekleri, İade ve Değişim (admin'den ortak şablonlar)
- "Daha fazla [kategori]" linki, benzer ürünler

### 11.5 Kampanya motoru (referansta öne çıkan, planımıza eklenen)
Referans sitede basit indirimin ötesinde **kural tabanlı kampanyalar** var. `campaigns` tablosu ile:

| Kampanya türü | Örnek |
|---|---|
| X Al Y Öde | "İç çamaşırlarında 3 Al 2 Öde" |
| Bir Alana Bir Bedava (BOGO) | "Kışlık pijamalarda 1 alana 1 bedava" (en ucuz ürün bedava) |
| Kategoriye sepette % indirim | "Çeyiz setlerinde sepette %26 indirim" (kod gerektirmez) |
| Kupon kodu | Klasik kupon |
| Ücretsiz kargo eşiği | "1800 TL ve üzeri kargo bedava" |
| Sepette hediye ürün | "Kutulu paket hediye" |

Alanlar: tür, koşullar (kategori/ürün/koleksiyon, min. tutar, min. adet), ödül, öncelik, birleştirilebilirlik, tarih aralığı, ürün kartı etiketi metni.

### 11.6 Eklenecek ek sayfalar / özellikler
- Favorilerim, istek listesi, fiyat alarmları (Hesabım altında)
- **Sipariş Takip** sayfası (misafirler için: sipariş no + e-posta)
- **Blog** modülü (kategori, yazı, SEO)
- Sıkça Sorulan Sorular, İletişim formu, KVKK, ETK (Elektronik Ticari İleti) aydınlatma metni, Mesafeli Satış Sözleşmesi, İptal/İade Koşulları
- Ürün karşılaştırma yok → kapsam dışı bırakılabilir

### 11.7 Veritabanına eklenecek tablolar
`announcement_bars`, `popups`, `menus`, `menu_items`, `homepage_sections`, `campaigns`, `campaign_conditions`, `sizes`, `size_charts`, `favorites`, `wishlists`, `price_alerts`, `product_views` (sosyal kanıt + gezilen ürünler), `saved_filters`, `faq`, `blog_posts`, `blog_categories`, `shipping_settings` (kargo kesim saati, çalışma günleri)

> Bu ek kapsam süreyi yaklaşık **+3 hafta** uzatır (kampanya motoru, blog, popup/duyuru, favori/fiyat alarmı). Toplam: **~19 hafta**.

---

### 11.8 Sepet, ödeme ve üyelik ekranları (11.10.2026 incelemesi)

**Sepet (`/checkout` 1. adım)**
- Başlık "Sepet (1)" + **Sepeti Temizle**
- **Ücretsiz kargo ilerleme bandı**: "Ücretsiz kargo hakkı kazanmanıza ₺849,91 kaldı!"
- Satır: görsel, ad, seçilen varyant rozeti ("Bralet Bedeni: 85B"), adet −/+ ve sil, eski/yeni fiyat
- **Kampanyalar kutusu**: sepete uygulanabilecek aktif kampanyaların açıklamaları listelenir
- Sağda **Sipariş Özeti** (Sepet Tutarı, indirimler, Toplam) + **Alışverişi Tamamla** + **Hediye Çeki Kullan**
- Altta çapraz satış: **Birlikte Alınanlar**, **Son Baktıklarım**, **Çok Satanlar** (karttan doğrudan "Sepete Ekle")

**Ödeme (`/checkout?step=payment`) — tek sayfa, iki sütun**
- Sol: adım kartları → **Teslimat Adresi** → **Ödeme Yöntemleri**
  - "Hızlı Satın Al" (misafir): e-posta + telefon; yanında "Üye ol veya Giriş yap"
  - Adres: Adres Başlığı, Ad Soyad, **İl / İlçe açılır listeleri**, Adres
  - **Fatura tipi**: Bireysel / Kurumsal (kurumsalda firma adı, vergi dairesi, vergi no)
- Sağ: sepet özeti (katlanabilir) + sipariş özeti
- Header sadeleşir (yalnızca logo + "Sepetim" geri linki) → odaklı ödeme sayfası
- → Bizde: `il` / `ilce` tabloları (81 il, 973 ilçe seed), `orders.invoice_type`, vergi alanları, mesafeli satış + ön bilgilendirme onayı ödeme adımında

**Üye ol (`/UyeOl`)**
- Üstte **Facebook ile Bağlan** / **Google ile Bağlan**
- Ad, Soyad, E-posta, Şifre (göster/gizle), Cep telefonu (ülke kodu seçici, +90)
- Ayrı onay kutuları: e-posta ile ticari ileti, SMS ile ticari ileti, üyelik koşulları + KVKK
- ⚠️ Referansta KVKK onay kutusu **önceden işaretli** geliyor — açık rıza "özgür iradeyle" verilmelidir; **bizde hiçbir onay kutusu önceden işaretli olmayacak**

**Üye girişi (`/UyeGiris`)**
- E-posta, Şifre (göster/gizle), **Giriş Yap**, **Şifremi Unuttum**, sosyal giriş butonları

**Hesabım / Sipariş Takip** giriş gerektirdiği için incelenmedi; Bölüm 8.2 kapsamı geçerli.

---

## 12. Kararlar

Bölüm başındaki **Alınan kararlar** tablosuna taşındı (K1–K5). Açık kalan konular:

1. **Marka kimliği:** site adı, logo, renk paleti, yazı tipi (şimdilik `resources/scss/_variables.scss` içinde geçici değerler)
2. **Alan adı ve hosting:** VPS önerilir (Docker + cron + kuyruk işçisi için)
3. **Kargo ücreti ve ücretsiz kargo eşiği** (admin panelinden değiştirilebilir olacak; başlangıç değeri)
