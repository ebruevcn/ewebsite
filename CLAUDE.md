# CLAUDE.md — Proje Çalışma Kuralları

Laravel 13 + PostgreSQL 16 + Bootstrap 5.3 ile geliştirilen e-ticaret platformu (kadın ev giyim / iç giyim; referans: lenahomewears.com — yalnızca yapı ve işlev referansı, içerik/marka kopyalanmaz).

## Oturum başlangıcı
1. **[YOL_HARITASI.md](YOL_HARITASI.md)** oku → "Şu an neredeyiz?" ve son günlük kaydı.
2. Gereksinim detayı gerekiyorsa **[PROJE_PLANI.md](PROJE_PLANI.md)** ilgili bölümü.
3. Mimari kararlar: `docs/adr/`.

## Oturum sonu
- YOL_HARITASI.md: görev durumlarını güncelle, "Şu an neredeyiz?" tablosunu ve **Çalışma Günlüğü**'ne yeni kayıt ekle.
- Yeni mimari karar alındıysa `docs/adr/` altına ADR yaz.

## Git
- **Commit atma, push yapma.** Kullanıcı açıkça istemedikçe hiçbir git commit/push/branch işlemi yapılmaz.

## İletişim
- Kullanıcıyla **Türkçe** konuş; kod, değişken ve sınıf adları **İngilizce**, kullanıcıya görünen metinler ve yorumlar Türkçe.

## Komutlar
```
composer check        # pint --test + larastan + testler + composer audit (commit öncesi zorunlu)
composer format       # pint ile otomatik düzelt
php artisan test      # PostgreSQL test veritabanı: eticaret_test
npm run dev / build   # Vite
```

## Kod standartları
- Her PHP dosyasında `declare(strict_types=1);` (Pint zorlar). Larastan seviye 8 hatasız olmalı; `@phpstan-ignore` ve baseline kullanılmaz.
- Controller ince; iş kuralları `app/Services` ve `app/Actions` içinde. Doğrulama + yetki `FormRequest` ile.
- Para: `brick/money`, DB'de `NUMERIC(12,2)`; **float ile para hesabı yapılmaz**.
- Fiyat, indirim, kampanya, stok her zaman **sunucuda** hesaplanır; istemciden gelen fiyat kullanılmaz.
- Durumlar PHP `enum` ile (OrderStatus, PaymentStatus...).
- Her yeni özellik için Feature testi; fiyat/kampanya/ödeme imza doğrulama için Unit testi.

## Güvenlik kuralları (pazarlık konusu değil)
- Ham SQL'de yalnızca bağlı parametre; dinamik sütun/sıralama beyaz liste ile.
- Blade'de `{!! !!}` yalnızca HTMLPurifier'dan geçmiş içerik için.
- Sahiplik kontrolü Policy ile (IDOR). Toplu atama için `$fillable` açıkça tanımlanır, `$guarded = []` yasak.
- Kart numarası/CVV hiçbir yerde saklanmaz/loglanmaz; ödeme bilgileri `encrypted` cast ile.
- Yüklenen görseller MIME doğrulanır, yeniden kodlanır, rastgele adla saklanır.
- Onay kutuları (KVKK, ticari ileti) **asla önceden işaretli** gelmez.
- Admin: ayrı `admin` guard, zorunlu 2FA, throttle, tüm işlemler activity log'a.

## Ortam notları (Windows geliştirme makinesi)
- PHP 8.4.11 `C:\Phps\8.4.11 - utf8\php.exe` — sqlite ve sodium eklentisi YOK (testler PostgreSQL'de koşar).
- PowerShell `Set-Content -Encoding utf8` BOM ekler → neon/json/php dosyalarını Write aracıyla yaz.
