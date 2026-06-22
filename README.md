<p align="center">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-Laravel%2012-FF2D20?logo=laravel&logoColor=white">
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=white">
  <img alt="PHP" src="https://img.shields.io/badge/PHP-%5E8.2-777BB4?logo=php&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Required-339933?logo=node.js&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="DaisyUI" src="https://img.shields.io/badge/DaisyUI-5-7C3AED?logo=daisyui&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg">
</p>

---

# Astronacci

Selamat datang di repository **Astronacci** — sebuah aplikasi *full-stack* yang terdiri dari backend API berbasis Laravel dan frontend antarmuka berbasis React. Repository ini menggunakan struktur *monorepo* sederhana, di mana kedua bagian aplikasi (backend dan frontend) disimpan dalam satu repository agar memudahkan sinkronisasi pengembangan.

Dokumen ini berfungsi sebagai panduan utama untuk menginstal, menjalankan, dan mengembangkan aplikasi ini di mesin lokal kamu.

---

## Daftar Isi

1. [Struktur Proyek](#struktur-proyek)
2. [Prasyarat](#prasyarat)
3. [Setup Backend (Laravel)](#setup-backend-laravel)
4. [Setup Frontend (React + Vite)](#setup-frontend-react--vite)
5. [Menjalankan Seluruh Aplikasi](#menjalankan-seluruh-aplikasi)
6. [Menjalankan dengan Docker (1 Container)](#menjalankan-dengan-docker-1-container)
7. [Kontribusi](#kontribusi)

---

## Struktur Proyek

```
astronacci/
├── backend/      # Laravel 12 — REST API & logika server
├── frontend/     # React 19 + Vite 8 — antarmuka pengguna
└── README.md     # Anda sedang membaca ini
```

| Bagian       | Stack Utama                                          |
|--------------|------------------------------------------------------|
| **Backend**  | Laravel 12, PHP 8.2, MySQL/PostgreSQL                |
| **Frontend** | React 19, Vite 8, TailwindCSS 4, DaisyUI, Vitest     |

---

## Prasyarat

Karena proyek ini mencakup dua *stack*, pastikan mesin kamu sudah terpasang *tools* berikut sebelum mulai:

| Dependency              | Versi / Catatan                                      |
|-------------------------|------------------------------------------------------|
| **PHP**                 | `8.2` atau lebih baru (untuk backend)               |
| **Composer**            | Manajer dependency PHP                              |
| **Node.js & NPM**       | Versi LTS (untuk frontend)                          |
| **Database**            | MySQL atau PostgreSQL                               |
| **Docker** *(opsional)* | Hanya jika ingin menjalankan via container/Sail     |

> **Tips:** Jalankan `php -v`, `composer -V`, `node -v`, dan `npm -v` untuk memverifikasi seluruh *tool* sudah terpasang dan sesuai versi.

---

## Setup Backend (Laravel)

Semua perintah dijalankan dari dalam direktori `backend/`. Backend bersifat *API-only* — tidak perlu Node.js/npm.

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Install dependency PHP
composer install

# 3. Salin file environment dan generate key
cp .env.example .env
php artisan key:generate

# 4. Jalankan migrasi database
php artisan migrate
```

---

## Setup Frontend (React + Vite)

Semua perintah dijalankan dari dalam direktori `frontend/`.

```bash
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependency JavaScript
npm install

# 3. (Opsional) Siapkan file environment
cp .env.example .env
```

---

## Menjalankan Seluruh Aplikasi

Aplikasi ini membutuhkan **dua proses yang berjalan secara paralel** — masing-masing di terminal terpisah.

### Terminal 1 — Backend Server

```bash
cd backend
php artisan serve
# API tersedia di http://localhost:8000
```

### Terminal 2 — Frontend Dev Server

```bash
cd frontend
npm run dev
# Frontend tersedia di http://localhost:5173 (default Vite)
```

---

## Menjalankan dengan Docker (1 Container)

Cara paling cepat: backend + frontend + SQLite berjalan dalam satu container via Docker Compose. Cocok untuk development lokal tanpa perlu install PHP/Node di mesin host.

### Prasyarat

- Docker (Docker Engine atau Docker Desktop)
- Docker Compose v2 (sudah bundle di Docker Desktop)

### First-time Setup

```bash
./setup.sh
```

Script akan otomatis: build image, install dependency backend + frontend, generate APP_KEY, migrasi database, dan start container di background. Setelah selesai:

- Backend  : http://localhost:8000
- Frontend : http://localhost:5173

### Command lain di `setup.sh`

| Command       | Aksi                                              |
|---------------|---------------------------------------------------|
| `./setup.sh`  | First-time setup: build + up                      |
| `./setup.sh build` | Build image saja                            |
| `./setup.sh up`     | Start container (sudah di-build)            |
| `./setup.sh down`   | Stop container                              |
| `./setup.sh logs`   | Tail log backend + frontend (Ctrl+C exit)  |
| `./setup.sh ssh`    | Masuk shell container                       |
| `./setup.sh fresh`  | Reset database (migrate:fresh)              |
| `./setup.sh clean`  | Hapus container + volume + image            |
| `./setup.sh help`   | Tampilkan daftar command                    |

### Hot reload

- **PHP:** Ubah file di `backend/` → perubahan langsung aktif pada request berikutnya (artisan serve reload code per request).
- **React/Vite:** Ubah file di `frontend/src/` → browser ter-update via HMR tanpa refresh manual.

### Catatan

- Source code `backend/` dan `frontend/` di-bind-mount ke container. Folder `vendor/` dan `node_modules/` akan muncul di host setelah `setup.sh` pertama (dibuat oleh container) — ini expected untuk dukungan IDE.
- Database SQLite ada di `backend/database/database.sqlite` (di host, persist antara restart).



---

<p align="center">
  Dibuat dengan ❤️ untuk Astronacci
</p>
