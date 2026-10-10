# E-Ticaret Platformu

Laravel 13 · PHP 8.4 · PostgreSQL 16 · Bootstrap 5.3 · Vite

- Proje planı: [PROJE_PLANI.md](PROJE_PLANI.md)
- İlerleme ve yol haritası: [YOL_HARITASI.md](YOL_HARITASI.md)
- Mimari kararlar: [docs/adr](docs/adr)

## Kurulum

### Seçenek A — Docker (önerilen)
Gereksinim: Docker Desktop.

```bash
cp .env.example .env
docker compose up -d
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
npm install && npm run build
```
Site: http://localhost:8000 · Gelen e-postalar (Mailpit): http://localhost:8025

`.env` içinde `DB_PASSWORD=secret` olmalı (docker-compose varsayılanı).

### Seçenek B — Yerel kurulum (Windows)
Gereksinimler: PHP 8.4 (pdo_pgsql, intl, gd, zip, bcmath, exif), Composer 2, PostgreSQL 16, Node.js 22 LTS.

1. PostgreSQL'de kullanıcı ve veritabanlarını oluşturun (`psql -U postgres`):
   ```sql
   CREATE USER eticaret WITH PASSWORD 'guclu-bir-sifre';
   CREATE DATABASE eticaret OWNER eticaret;
   CREATE DATABASE eticaret_test OWNER eticaret;
   \c eticaret
   CREATE EXTENSION IF NOT EXISTS citext; CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;
   \c eticaret_test
   CREATE EXTENSION IF NOT EXISTS citext; CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;
   ```
2. Uygulama:
   ```bash
   composer install
   cp .env.example .env        # DB_PASSWORD değerini girin
   php artisan key:generate
   php artisan migrate
   npm install && npm run build
   php artisan serve
   ```

## Geliştirme komutları

| Komut | Açıklama |
|---|---|
| `composer check` | Kod stili + statik analiz + testler + güvenlik taraması (commit öncesi) |
| `composer format` | Kod stilini otomatik düzelt |
| `php artisan test` | Testler (`eticaret_test` veritabanı) |
| `npm run dev` | Vite geliştirme sunucusu |

## Dal stratejisi
- `main` → canlı, `develop` → entegrasyon, `feature/F2-05-varyant-matrisi` → görev dalları (ID'ler YOL_HARITASI.md'den)
- Commit mesajları: `feat(katalog): varyant matrisi (F2-05)` biçiminde
