# 📖 Panduan Lengkap Web App WAKA III MMD Darussalamah

Aplikasi web ini dibuat khusus untuk memantau dan mengelola:
1. **Data Anggota LBM** (Madrasah Islamiyah Darussalamah)
2. **Daftar Pemberangkatan & Delegasi Bahtsul Masail** (31+ Forum se-Jawa Madura)
3. **Kalender Kerja Tahunan MMD** (Jadwal Kegiatan Lengkap 1 Tahun Hijriyah & Masehi)
4. **Rekapitulasi Keuangan RAB & LPJ** (Transparansi Saldo & Anggaran)
5. **Sinkronisasi Dua Arah ke Google Sheets** (Edit Biodata langsung dari Web App ke Spreadsheet)

---

## 🌟 Cara Mencoba di Komputer Sendiri (Localhost)

Aplikasi saat ini dapat dijalankan secara lokal:
```bash
npm run dev
```
Buka browser Anda dan kunjungi:
👉 **[http://localhost:3000](http://localhost:3000)** (atau port dev yang sedang aktif)

### Menu Halaman yang Tersedia:
- **Dashboard** (`/`) — Ringkasan metrik santri, agenda bahsu, kalender kerja, grafik perkembangan, dan keuangan.
- **Anggota LBM** (`/anggota`) — Daftar 25 santri, filter kelas, filter status perkembangan, pencarian nama, modal arsip biodata, serta tombol **Edit Biodata** untuk Admin.
- **Pemberangkatan Bahsu** (`/bahsu`) — Jadwal forum Bahtsul Masail + delegasi santri, deteksi delegasi otomatis dengan profil santri LBM, serta tombol **Edit Biodata Santri** langsung dari daftar pemberangkatan.
- **Kalender Kerja** (`/kalender`) — Kalender Kerja MMD 1 Tahun (filter bulan Hijriyah, filter WAKA III, filter koordinator).
- **Keuangan** (`/keuangan`) — Tabel rekapitulasi subsidi vs pengeluaran, saldo, catatan RAB & LPJ per periode.
- **Login Admin** (`/login`) — Masuk sebagai admin (user: `MMD`, pass: `WAKA3`) untuk mengaktifkan fitur edit dan broadcast.

---

## ⚡ Panduan Konfigurasi Token & Deployment Google Apps Script

Ikuti panduan terstruktur berikut untuk mengonfigurasi autentikasi rahasia server-to-server dan melakukan deployment Web App di Google Sheets:

### 1. Buka Proyek Google Apps Script
1. Buka spreadsheet Google Sheets WAKA III:
   👉 **[Spreadsheet WAKA III (statistik new 2.xlsx)](https://docs.google.com/spreadsheets/d/1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS/edit)**
2. Pada menu atas, klik **Ekstensi (Extensions)** > **Apps Script**. Tab baru editor Apps Script akan terbuka.

### 2. Buat Token Acak yang Kuat di Komputer Anda (Lokal)
Jalankan salah satu perintah berikut di terminal komputer Anda untuk menghasilkan token acak 32-byte (64 karakter heksadesimal) dengan entropi tinggi:

**Menggunakan Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*Atau* **Menggunakan PowerShell (Windows):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```
> [!CAUTION]
> Simpan nilai token yang dihasilkan di tempat yang aman (misalnya password manager Anda). **Jangan pernah membagikan nilai token rahasia ini ke obrolan publik, repositori GitHub, atau file frontend.**

### 3. Simpan Token pada Script Properties (Project Settings)
1. Di sidebar sebelah kiri editor Google Apps Script, klik ikon gerigi **Project Settings (Setelan Project)** ⚙️.
2. Gulir ke bawah hingga bagian **Script Properties (Properti Skrip)**.
3. Klik tombol **Add script property (Tambahkan properti skrip)** (atau **Edit script properties** jika sudah ada baris).
4. Masukkan konfigurasi berikut:
   - **Property**: `SHEETS_API_SECRET_TOKEN` *(wajib persis sama huruf besar semua)*
   - **Value**: *(tempelkan token acak yang baru saja Anda hasilkan di Langkah 2)*
5. Klik **Save script properties (Simpan properti skrip)**.

### 4. Perbarui dan Simpan Kode Apps Script
1. Di sidebar sebelah kiri, klik ikon **Editor (Editor berkas)** `< >`.
2. Buka berkas `Code.gs` (atau buat jika belum ada).
3. Hapus seluruh isi kode lama, lalu salin dan tempel seluruh isi kode terbaru dari:
   👉 **[`google-apps-script/Code.js`](google-apps-script/Code.js)**
4. Klik ikon **Simpan (Save)** 💾 (atau tekan `Ctrl + S`).

### 5. Deploy sebagai Web App
1. Di sudut kanan atas editor, klik tombol biru **Deploy (Terapkan)** > **New deployment (Penerapan baru)**.
2. Jika belum terpilih, klik ikon gerigi di sebelah kiri **Select type** > pilih **Web app**.
3. Isi kolom konfigurasi:
   - **Description**: `WAKA III Sync API v2`
   - **Execute as (Jalankan sebagai)**: **Me (email akun Google Anda)**
   - **Who has access (Siapa yang memiliki akses)**: **Anyone (Siapa saja)**
   *(Catatan: Akses publik dilindungi oleh token `SHEETS_API_SECRET_TOKEN` yang diverifikasi secara server-to-server. Tanpa token yang cocok, permintaan tulis akan ditolak otomatis).*
4. Klik tombol **Deploy (Terapkan)**.
5. Jika diminta otorisasi akses:
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Klik **Advanced (Lanjutan)** > klik **Go to WAKA III Sync API (unsafe)**.
   - Klik **Allow (Izinkan)**.
6. Salin **Web App URL** yang berakhiran `/exec`.

---

## 🔐 Konfigurasi Variabel Lingkungan di Hosting Website

### 1. Di Komputer Sendiri (`waka3-app/.env.local`)
Buka berkas `waka3-app/.env.local` dan masukkan:
```env
GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
SHEETS_API_SECRET_TOKEN=nilai_token_rahasia_hasil_langkah_2
```

### 2. Di Dashboard Vercel (Produksi)
1. Buka [vercel.com](https://vercel.com) > buka project Anda (`waka-iii`).
2. Masuk ke **Settings** > **Environment Variables**.
3. Tambahkan 2 variabel berikut:
   - **`GOOGLE_SHEETS_SCRIPT_URL`** = *(URL Web App berakhiran /exec dari Langkah 5)*
   - **`SHEETS_API_SECRET_TOKEN`** = *(Nilai token rahasia dari Langkah 2)*
4. Pastikan opsi **Production**, **Preview**, dan **Development** dicentang.
5. Klik **Save**.
6. Buka tab **Deployments**, klik titik tiga pada deployment terbaru, lalu pilih **Redeploy** agar Vercel memuat environment variable baru.

---

## 🔄 Cara Redeploy Jika Kode Apps Script Diperbarui di Masa Depan

Setiap kali Anda mengubah kode di Apps Script:
1. Klik **Deploy** > **Manage deployments (Kelola penerapan)**.
2. Klik ikon pensil **Edit** di kanan atas modal.
3. Pada dropdown **Version**, pilih **New version (Versi baru)**.
4. Klik **Deploy**. URL `/exec` akan tetap sama dan otomatis menggunakan kode versi terbaru.

---

## 📋 Cara Memeriksa Log Eksekusi Tanpa Membocorkan Token

1. Di sidebar sebelah kiri Apps Script, klik menu **Executions (Eksekusi)** (ikon daftar riwayat).
2. Anda dapat melihat riwayat setiap panggilan `doPost` dan `doGet`, durasi proses, serta status (*Completed* atau *Failed*).
3. Kode `Code.js` telah dirancang khusus agar nilai token rahasia **tidak pernah dicetak** ke dalam log, terminal, maupun pesan kesalahan.

---

## 🧪 Checklist Pengujian Sebelum Digunakan

Lakukan pengujian berikut secara bertahap:

1. [ ] **Uji Endpoint Kesehatan (GET)**:
   - Buka URL Web App Anda di browser: `https://script.google.com/macros/s/.../exec`.
   - Respons harus berupa JSON: `{"status":"online","service":"WAKA III Google Sheets Sync API","configured":true,...}` tanpa membocorkan token.
2. [ ] **Uji Penolakan POST Tanpa Token / Token Salah**:
   - Permintaan tanpa token atau dengan token salah harus ditolak dengan status **401 Unauthorized**.
3. [ ] **Uji Penolakan Tanpa Hak Admin di Website**:
   - Jika belum login di `/login`, permintaan tulis langsung ditolak **403 Forbidden** oleh backend Next.js.
4. [ ] **Uji Validasi Kolom Terlarang**:
   - Backend Next.js hanya mengizinkan kolom: `nama`, `kelas`, `perkembangan`, `ttl`, `alamat`, `domisili`, `ayahIbu`.
5. [ ] **Uji Simpan Biodata Santri dari Halaman Bahsu (`/bahsu`)**:
   - Login sebagai admin di `/login` (User: `MMD`, Pass: `WAKA3`).
   - Buka `/bahsu`, klik tombol **Edit Biodata** pada salah satu delegasi santri.
   - Ubah salah satu data (misal status atau kelas santri uji).
   - Klik **Simpan Perubahan**, amati animasi spinner, dan periksa notifikasi sukses hijau.
6. [ ] **Uji Verifikasi di Spreadsheet**:
   - Buka tab `PERKEMBANGAN` di Google Sheets, pastikan baris santri tersebut telah berubah.
   - Kolom `No.`, `BAHTSU YANG DIDATANGI`, dan tanggal agenda tidak terganggu.
7. [ ] **Uji Sinkronisasi ke Halaman Anggota (`/anggota`)**:
   - Buka `/anggota`, pastikan nama/kelas santri yang baru diedit langsung memuat data terbaru.

---

## 🚀 Panduan Deploy Pembaruan ke GitHub

```bash
git add .
git commit -m "fix(security): amankan token sheets script properties dan perbaiki pencocokan delegasi"
git push origin main
```
