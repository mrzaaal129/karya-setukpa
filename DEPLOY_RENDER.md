# Panduan Deploy LENGKAP ke Render.com
## Sistem Manajemen Makalah Digital SETUKPA

---

# BAGIAN 1: UPLOAD KE GITHUB

## 📋 Persiapan Sebelum Mulai

**Yang dibutuhkan:**
- Akun email aktif
- Koneksi internet
- Folder proyek `Karya-Setukpa` yang sudah ada

---

## Step 1.1: Buat Akun GitHub

1. Buka browser, ketik: **https://github.com**
2. Klik tombol **"Sign up"** (pojok kanan atas)
3. Isi form pendaftaran:
   - **Email**: masukkan email aktif Anda
   - **Password**: buat password yang kuat
   - **Username**: pilih nama unik (contoh: `rizal-setukpa`)
4. Selesaikan verifikasi (puzzle/captcha)
5. Cek email, klik link verifikasi dari GitHub
6. Pilih plan **"Free"** (gratis)

**Akun GitHub Anda sudah siap!** ✅

---

## Step 1.2: Install Git di Komputer

1. Buka browser, ketik: **https://git-scm.com/download/windows**
2. Download akan mulai otomatis
3. Buka file installer yang didownload
4. Klik **Next** terus sampai selesai (gunakan setting default)
5. Klik **Install**
6. Tunggu sampai selesai, klik **Finish**

**Untuk cek apakah sudah terinstall:**
- Buka Command Prompt (ketik `cmd` di Start Menu)
- Ketik: `git --version`
- Jika keluar angka versi, berarti sudah berhasil

---

## Step 1.3: Konfigurasi Git (Sekali Saja)

Buka **Command Prompt** atau **PowerShell**, ketik perintah berikut:

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
```

**Ganti "Nama Anda" dengan nama asli Anda**
**Ganti "email@anda.com" dengan email GitHub Anda**

---

## Step 1.4: Buat Repository di GitHub

1. Login ke GitHub (https://github.com)
2. Klik tanda **"+"** di pojok kanan atas
3. Pilih **"New repository"**
4. Isi form:
   - **Repository name**: `karya-setukpa`
   - **Description**: `Sistem Manajemen Makalah Digital SETUKPA`
   - **Visibility**: Pilih **Private** (supaya tidak bisa dilihat orang lain)
   - **JANGAN centang** "Add a README file"
5. Klik tombol hijau **"Create repository"**

**Repository sudah dibuat!** ✅

---

## Step 1.5: Upload Kode ke GitHub

Buka **Command Prompt** atau **PowerShell**, lalu:

### Langkah 1: Masuk ke folder proyek
```bash
cd C:\Users\ASUS\Downloads\Karya-Setukpa
```

### Langkah 2: Inisialisasi Git
```bash
git init
```

### Langkah 3: Tambahkan semua file
```bash
git add .
```

### Langkah 4: Buat commit pertama
```bash
git commit -m "Initial commit - SETUKPA application"
```

### Langkah 5: Hubungkan ke GitHub
```bash
git remote add origin https://github.com/USERNAME/karya-setukpa.git
```
**Ganti `USERNAME` dengan username GitHub Anda!**

### Langkah 6: Upload ke GitHub
```bash
git branch -M main
git push -u origin main
```

### Jika diminta login:
- Masukkan username GitHub Anda
- Untuk password, gunakan **Personal Access Token** (lihat langkah berikutnya)

---

## Step 1.6: Membuat Personal Access Token (Untuk Password)

Karena GitHub tidak menerima password biasa, Anda perlu token:

1. Login ke GitHub
2. Klik foto profil Anda (pojok kanan atas)
3. Pilih **"Settings"**
4. Scroll ke bawah, klik **"Developer settings"** (paling bawah)
5. Klik **"Personal access tokens"** → **"Tokens (classic)"**
6. Klik **"Generate new token"** → **"Generate new token (classic)"**
7. Isi form:
   - **Note**: `Untuk upload Setukpa`
   - **Expiration**: pilih 90 days
   - **Centang**: `repo` (semua checkbox di bawahnya ikut tercentang)
8. Scroll ke bawah, klik **"Generate token"**
9. **PENTING**: Copy token yang muncul (hanya muncul sekali!)
10. Simpan token di tempat aman

**Gunakan token ini sebagai password saat git push**

---

## Step 1.7: Verifikasi Upload Berhasil

1. Buka GitHub di browser
2. Buka repository `karya-setukpa` Anda
3. Anda seharusnya melihat folder `backend` dan `frontend`

**SELAMAT! Kode Anda sudah di GitHub!** 🎉

---

---

# BAGIAN 2: DEPLOY KE RENDER.COM

---

## Step 2.1: Buat Akun Render.com

1. Buka browser, ketik: **https://render.com**
2. Klik **"Get Started for Free"**
3. Pilih **"Sign up with GitHub"** (paling mudah!)
4. Anda akan diarahkan ke GitHub, klik **"Authorize Render"**
5. Akun Render Anda sudah aktif!

---

## Step 2.2: Deploy Database PostgreSQL

**Database adalah tempat menyimpan data user, tugas, paper, dll.**

1. Di Dashboard Render, klik tombol biru **"New +"**
2. Pilih **"PostgreSQL"**
3. Isi form dengan teliti:

| Field | Isi dengan |
|-------|------------|
| **Name** | `setukpa-database` |
| **Database** | `setukpa` |
| **User** | (biarkan default, jangan diubah) |
| **Region** | **Singapore (Southeast Asia)** |
| **PostgreSQL Version** | 15 |
| **Instance Type** | **Free** |

4. Klik tombol **"Create Database"**
5. Tunggu sampai status menjadi **"Available"** (sekitar 2-3 menit)

**PENTING - COPY INI:**
- Setelah database siap, scroll ke bawah
- Cari **"Internal Database URL"**
- Klik **"Copy"** pada URL tersebut
- **Simpan di Notepad!** (akan digunakan nanti)

Contoh URL:
```
postgres://setukpa_user:abc123xyz@dpg-xxx.singapore-postgres.render.com/setukpa
```

---

## Step 2.3: Deploy Backend (API Server)

1. Klik **"New +"** → **"Web Service"**
2. Pilih **"Build and deploy from a Git repository"**
3. Klik **"Connect"** pada repository `karya-setukpa` Anda
4. Isi form dengan teliti:

| Field | Isi dengan |
|-------|------------|
| **Name** | `setukpa-api` |
| **Region** | **Singapore (Southeast Asia)** |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | **Node** |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

5. Scroll ke bawah, cari **"Environment Variables"**
6. Klik **"Add Environment Variable"** untuk SETIAP variabel berikut:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | (paste URL dari Step 2.2) |
| `JWT_SECRET` | `setukpa-secret-key-2026-production-very-secure-key` |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | (kosongkan dulu, isi nanti) |

7. Klik tombol **"Create Web Service"**
8. Tunggu proses build... (5-10 menit pertama kali)

**Perhatikan log di layar:**
- Jika ada error merah, baca pesannya
- Jika sukses, akan muncul "Your service is live"

9. **PENTING - COPY URL BACKEND:**
   - Lihat di bagian atas halaman
   - Ada URL seperti: `https://setukpa-api.onrender.com`
   - **Simpan URL ini di Notepad!**

---

## Step 2.4: Jalankan Migrasi Database

Setelah backend berhasil deploy:

1. Di halaman backend service, klik tab **"Shell"** (di bagian atas)
2. Tunggu terminal muncul
3. Ketik perintah berikut satu per satu:

```bash
npx prisma migrate deploy
```
Tunggu sampai selesai, lalu:

```bash
npx prisma db seed
```
Ini akan membuat data awal (admin account, dll)

4. Jika ada error, screenshot dan tanyakan ke saya

---

## Step 2.5: Deploy Frontend (Website)

1. Klik **"New +"** → **"Static Site"**
2. Connect repository yang sama (`karya-setukpa`)
3. Isi form:

| Field | Isi dengan |
|-------|------------|
| **Name** | `setukpa-web` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Tambah **Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://setukpa-api.onrender.com/api` |

**Ganti URL dengan URL backend Anda dari Step 2.3!**

5. Klik **"Create Static Site"**
6. Tunggu proses build... (3-5 menit)
7. **COPY URL FRONTEND:**
   - Contoh: `https://setukpa-web.onrender.com`

---

## Step 2.6: Hubungkan Backend dengan Frontend (CORS)

1. Kembali ke service **Backend** (`setukpa-api`)
2. Klik tab **"Environment"**
3. Cari variabel `CORS_ORIGIN`
4. Klik **Edit**, isi dengan URL frontend:
   ```
   https://setukpa-web.onrender.com
   ```
5. Klik **"Save Changes"**
6. Backend akan restart otomatis (tunggu 1-2 menit)

---

## Step 2.7: Test Aplikasi!

1. Buka URL frontend Anda di browser:
   ```
   https://setukpa-web.onrender.com
   ```

2. Harusnya muncul halaman login SETUKPA

3. Login dengan akun default:
   - **NOSIS**: `SUPERADMIN`
   - **Password**: `superadmin123`

4. Jika berhasil masuk ke dashboard, **SELAMAT!** 🎉

---

## ⚠️ Troubleshooting (Jika Ada Masalah)

| Masalah | Kemungkinan Penyebab | Solusi |
|---------|---------------------|--------|
| Halaman blank/kosong | VITE_API_URL salah | Cek dan perbaiki environment variable di frontend |
| Error "Network Error" | CORS belum diset | Update CORS_ORIGIN di backend |
| Error 502 Bad Gateway | Server sedang bangun | Tunggu 30 detik, refresh |
| Login gagal | Database belum di-seed | Jalankan `npx prisma db seed` di Shell |
| Build failed | Ada error di kode | Cek logs, screenshot errornya |

---

## 📝 Catatan Penting Free Tier

1. **Server Tidur**: Setelah 15 menit tidak ada aktivitas, server tidur
2. **Waktu Bangun**: Butuh ~30 detik saat pertama diakses
3. **Database**: Gratis 90 hari, setelah itu perlu renew

---

## ✅ Checklist Akhir

- [ ] Akun GitHub sudah dibuat
- [ ] Kode sudah diupload ke GitHub
- [ ] Akun Render sudah dibuat
- [ ] Database PostgreSQL sudah aktif
- [ ] Backend sudah deploy dan running
- [ ] Migrasi database sudah dijalankan
- [ ] Frontend sudah deploy
- [ ] CORS sudah diupdate
- [ ] Bisa login ke aplikasi

**Semua tercentang? Aplikasi Anda sudah LIVE!** 🚀
