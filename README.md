<p align="center">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-Laravel%2012-FF2D20?logo=laravel&logoColor=white">
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=white">
  <img alt="PHP" src="https://img.shields.io/badge/PHP-%5E8.2-777BB4?logo=php&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="DaisyUI" src="https://img.shields.io/badge/DaisyUI-5-7C3AED?logo=daisyui&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg">
</p>

# Astronacci

Aplikasi *full-stack*: **backend Laravel 12** (API-only) + **frontend React 19** (Vite), database **SQLite** default.

## Quick Start (Docker)

Prasyarat: Docker + Docker Compose v2.

```bash
./setup.sh
```

Container menjalankan backend + frontend + SQLite sekaligus. Script akan otomatis:

- Mendeteksi IP server dan mencetak URL yang bisa diakses dari device lain di jaringan.
- Membuat `frontend/.env` dengan `VITE_API_BASE_URL=http://<IP>:8000` (agar frontend request ke IP yang benar, bukan `localhost`).
- Menambahkan `http://<IP>:5173` ke whitelist `allowed_origins` di `backend/config/cors.php` (mencegah error CORS saat akses cross-device).

Kedua langkah bersifat **idempoten** — aman dijalankan ulang. Untuk re-generate config setelah IP berubah (mis. pindah server), jalankan `./setup.sh config` lalu restart container.

### Helper `setup.sh`

| Command             | Aksi                                              |
|---------------------|---------------------------------------------------|
| `./setup.sh`        | First-time setup: build + up + auto-config IP     |
| `./setup.sh build`  | Build image saja                                  |
| `./setup.sh up`     | Start container (auto-generate `.env` & patch CORS)|
| `./setup.sh config` | Generate `frontend/.env` & patch CORS tanpa start |
| `./setup.sh down`   | Stop container                                    |
| `./setup.sh logs`   | Tail log backend + frontend                       |
| `./setup.sh ssh`    | Masuk shell container                             |
| `./setup.sh fresh`  | Reset database (`migrate:fresh`)                  |
| `./setup.sh clean`  | Hapus container + volume + image                  |

### Konfigurasi IP & CORS (multi-server)

Setup di atas otomatis jalan saat `./setup.sh` atau `./setup.sh up`. Jika Anda sebelumnya membuat `frontend/.env` manual atau deploy ke server lain dengan IP berbeda, hapus langkah manual dan andalkan `setup.sh`:

1. Hapus file lama (jika IP berubah): `rm frontend/.env`
2. Jalankan: `./setup.sh down && ./setup.sh` (atau `./setup.sh config` lalu `docker compose restart`)
3. Hard refresh browser (`Ctrl+Shift+R`) untuk menghapus cache `api.js` versi lama.

## Manual Setup (per folder)

Pilih jalur ini untuk run tanpa Docker. Backend dan frontend berjalan di **dua terminal terpisah**.

### Backend — `backend/`

Prasyarat: PHP 8.2+, Composer. SQLite sudah *bundled* di PHP, tidak butuh server DB terpisah. Backend **API-only**, tidak butuh Node.js.

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0     # http://<server-ip>:8000
```

### Frontend — `frontend/`

Prasyarat: Node.js LTS. Vite otomatis bind ke `0.0.0.0` lewat konfigurasi (`vite.config.js`).

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                           # http://<server-ip>:5173
```

## Struktur Proyek

```
astronacci/
├── backend/            Laravel 12 — REST API
├── frontend/           React 19 + Vite 8 — UI
├── docker/             entrypoint.sh + supervisord.conf
├── docker-compose.yml
├── Dockerfile
├── setup.sh
└── README.md
```

## Catatan Teknis

- **Hot reload:** PHP reload per request (file bind-mount); React via Vite HMR.
- **Volume:** `vendor/` & `node_modules/` muncul di host setelah `setup.sh` pertama — expected untuk dukungan IDE.
- **Database:** `backend/database/database.sqlite` (di host, persist antara restart).

<p align="center">
  Dibuat dengan ❤️ untuk Astronacci
</p>
