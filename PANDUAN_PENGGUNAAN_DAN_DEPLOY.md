# 📖 Panduan Lengkap Web App WAKA III MMD Darussalamah

Aplikasi web ini dibuat khusus untuk memantau:
1. **Data Anggota LBM** (Madrasah Islamiyah Darussalamah)
2. **Daftar Pemberangkatan & Delegasi Bahtsul Masail** (31+ Forum se-Jawa Madura)
3. **Kalender Kerja Tahunan MMD** (Jadwal Kegiatan Lengkap 1 Tahun Hijriyah & Masehi)
4. **Rekapitulasi Keuangan RAB & LPJ** (Transparansi Saldo & Anggaran)

Seluruh data terhubung langsung dengan Google Sheets (CSV) sehingga otomatis terupdate setiap kali Anda mengubah isi spreadsheet.

---

## 🌟 Cara Mencoba di Komputer Sendiri (Localhost)

Aplikasi saat ini **sudah aktif dan berjalan**. Silakan buka browser Anda (Chrome / Edge / Firefox) dan kunjungi:

👉 **[http://localhost:3001](http://localhost:3001)**

### Menu Halaman yang Tersedia:
- **Dashboard** (`/`) — Ringkasan metrik santri, agenda bahsu, kalender kerja, grafik perkembangan, dan keuangan.
- **Anggota LBM** (`/anggota`) — Daftar 25 santri, filter kelas, filter status perkembangan, pencarian nama.
- **Pemberangkatan Bahsu** (`/bahsu`) — Jadwal forum Bahtsul Masail (Lirboyo, Ploso, Sarang, Bangkalan, Tuban, dll) + delegasi santri & status kehadiran.
- **Kalender Kerja** (`/kalender`) — **Kalender Kerja MMD 1 Tahun**:
  - Filter tab per bulan: Syawwal, Dzulqadah, Dzulhijjah, Muharrom, Shofar, R. Awwal, R. Tsani, Jumadal Ula, Jumadal Akhiroh, Rojab, Sya'ban.
  - Filter cepat: **Khusus WAKA III** (menampilkan kegiatan LBM, Ubudiyah, Muamalah, pembinaan).
  - Filter koordinator: Kepala, Waka I, Waka II, Sekretaris, dll.
  - Pencarian kegiatan real-time.
- **Keuangan** (`/keuangan`) — Tabel rekapitulasi subsidi vs pengeluaran, saldo, catatan RAB bulan mendatang.
- **Login Admin** (`/login`) — Masuk sebagai admin (user: `MMD`, pass: `WAKA3`) untuk mengaktifkan tombol edit ke Google Sheets.

---

## 🔑 Hak Akses & Cara Kerja Login Admin

1. **Pengunjung Biasa (Tanpa Login):**
   - Dapat melihat seluruh data dengan aman.
   - Tidak ada tombol edit.

2. **Login Admin:**
   - Kunjungi menu **Login** (atau buka `/login`).
   - Masukkan kredensial:
     - **Username:** `MMD`
     - **Password:** `WAKA3`
   - Klik **Masuk sebagai Admin**.
   - Setelah login, tombol tosca **"Edit Data di Google Sheets"** akan otomatis muncul di seluruh halaman web.

---

## 📄 File Pengaturan Link Google Sheets

Semua pengaturan link data disimpan di satu file:
👉 **`waka3-app/lib/dataLinks.js`**

1. Data Anggota LBM (Tab PERKEMBANGAN)
2. Data Pemberangkatan Bahsu (Tab DAFTAR PEMBERANGKATAN BAHSU)
3. Kalender Kerja MMD (Kalender Kerja 1 Tahun)
4. Data Keuangan (Ringkasan RAB & LPJ)

---

## 🚀 Panduan Deploy ke Vercel (Gratis 100%)

1. **Buat Akun**: Daftar di [github.com](https://github.com) dan [vercel.com](https://vercel.com).
2. **Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Web App WAKA III Darussalamah"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/waka3-darussalamah.git
   git push -u origin main
   ```
3. **Deploy di Vercel**:
   - Di [vercel.com](https://vercel.com), klik **Add New...** > **Project**.
   - Import repositori `waka3-darussalamah`.
   - Klik **Deploy**. Web Anda langsung aktif di internet secara gratis!
