# AUDIT UI/UX MENYELURUH WEBSITE WAKA III (MMD PP. DARUSSALAM SUMBERSARI)

Dokumen ini disusun sebagai bagian dari proses audit desain, standarisasi sistem visual, dan penyempurnaan pengalaman pengguna (UI/UX) berbasis metodologi **UI/UX Pro Max** serta prinsip **Anti-Slop** untuk dashboard operasional dan pelaporan institusi pendidikan/pesantren.

---

## 1. SISTEM DESAIN RESMI WAKA III

Berdasarkan analisis identitas kelembagaan Majelis Musyawarah Diniyah (MMD) Pondok Pesantren Darussalam Sumbersari dan panduan UI/UX Pro Max untuk aplikasi administrasi formal, sistem desain dibakukan dengan spesifikasi berikut:

### 1.1 Palet Warna Inti (Institutional Palette)

| Elemen Token | Kode HEX | Nilai HSL | Kegunaan & Rasio Kontras |
| :--- | :--- | :--- | :--- |
| **Navy Utama (Primary)** | `#0A192F` | `hsl(216, 65%, 11%)` | Header, judul utama, kartu hero, navbar (Kontras > 12:1 terhadap putih) |
| **Navy Panel (Surface Dark)** | `#0F2444` | `hsl(216, 64%, 16%)` | Panel samping, kontainer kontras tinggi, kartu jam istiwa |
| **Putih Murni (Surface Light)** | `#FFFFFF` | `hsl(0, 0%, 100%)` | Latar kartu utama, modal, baris tabel ganjil |
| **Latar Belakang (App Background)** | `#F0F4FA` | `hsl(218, 54%, 96%)` | Background kanvas aplikasi (mencegah kelelahan mata operator) |
| **Emas Primer (Gold Accent)** | `#C5A059` | `hsl(40, 48%, 56%)` | Aksen border premium, badge prestisius, pilar identitas pesantren |
| **Emas Terang (Gold Highlight)** | `#D4AF37` | `hsl(46, 65%, 52%)` | Ikon aktif, gradient highlight, status istimewa |
| **Border & Divider** | `#E2E8F0` | `hsl(214, 32%, 91%)` | Garis batas kartu, pemisah kolom tabel, pemisah input |
| **Teks Utama (Body Primary)** | `#0A192F` | `hsl(216, 65%, 11%)` | Teks bacaan utama, angka statistik, label form |
| **Teks Sekunder (Body Muted)** | `#475569` | `hsl(215, 19%, 35%)` | Keterangan tambahan, tanggal, sub-label (Kontras > 4.5:1 WCAG AA) |
| **Status Sukses / Terlaksana** | `#059669` / `#ECFDF5` | `Emerald-600 / 50` | Status "SUDAH", sinkronisasi sukses, data valid |
| **Status Menunggu / Terjadwal** | `#D97706` / `#FFFBEB` | `Amber-600 / 50` | Status "BELUM BERANGKAT", agenda mendatang |
| **Status Izin / Catatan** | `#4F46E5` / `#EEF2FF` | `Indigo-600 / 50` | Status "IZIN", penugasan khusus, muhafadzoh |

---

## 2. INVENTARIS ELEMEN KARTU & IMPLEMENTASI ANIMASI

Sesuai arahan pada **Tahap 4**, seluruh elemen visual berbentuk kartu pada seluruh halaman aplikasi telah diinventarisasi dan ditingkatkan dengan sistem animasi konsisten (fade-in naik, stagger berurutan, hover lift `y: -4px`, elevated shadow, serta dukungan `prefers-reduced-motion`).

| No | Nama Kartu / Fungsi | Halaman & Lokasi | File Sumber | Jenis Interaksi | Efek Animasi Diterapkan | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **Statistik Total Anggota LBM** | Dashboard Utama (`/`) | `components/StatCard.js` | Tautan navigasi (`href="/anggota"`) | Stagger entrance (0.05s delay), hover lift `-4px`, icon scale `1.08` | ✅ Selesai |
| 2 | **Statistik Forum Bahtsul Masail** | Dashboard Utama (`/`) | `components/StatCard.js` | Tautan navigasi (`href="/bahsu"`) | Stagger entrance (0.10s delay), hover lift `-4px`, icon scale `1.08` | ✅ Selesai |
| 3 | **Statistik Delegasi Terlaksana** | Dashboard Utama (`/`) | `components/StatCard.js` | Filter interaktif (`status=sudah`) | Stagger entrance (0.15s delay), hover lift `-4px`, icon scale `1.08` | ✅ Selesai |
| 4 | **Statistik Delegasi Mendatang** | Dashboard Utama (`/`) | `components/StatCard.js` | Filter interaktif (`status=belum`) | Stagger entrance (0.20s delay), hover lift `-4px`, icon scale `1.08` | ✅ Selesai |
| 5 | **Kartu Jam Istiwa Dashboard** | Dashboard Utama (`/`) | `components/JamIstiwaCard.js` | Status live clock + konversi waktu | Fade-in slide up, pulse halus indikator aktif, aksen border emas | ✅ Selesai |
| 6 | **Kartu Distribusi Kelas (PieChart)** | Dashboard Utama (`/`) | `components/PieChart.js` | Visual chart interaktif | Card reveal, hover elevation, container rounded-2xl | ✅ Selesai |
| 7 | **Kartu Kalender MMD** | Dashboard & Kalender (`/kalender-mmd`) | `components/KalenderView.js` | Navigasi bulan, klik tanggal | Card reveal, stagger event badges, hover elevation | ✅ Selesai |
| 8 | **Kartu Ringkasan Status Bahtsul** | Halaman Bahsu (`/bahsu`) | `components/BahsuTable.js` | Filter data (Semua, Terlaksana, Mendatang, Izin) | 4 Animated cards dengan pill badge & live counter, hover lift `-2px` | ✅ Selesai |
| 9 | **Kartu Portal Navigasi WAKA I** | Portal Beranda (`/`) | `components/portal/PortalWakaCards.js` | Navigasi modul kurikulum | Stagger entrance, hover border emas, icon tilt halus | ✅ Selesai |
| 10 | **Kartu Portal Navigasi WAKA II** | Portal Beranda (`/`) | `components/portal/PortalWakaCards.js` | Navigasi modul kesiswaan | Stagger entrance, hover border emas, icon tilt halus | ✅ Selesai |
| 11 | **Kartu Portal Navigasi WAKA III** | Portal Beranda (`/`) | `components/portal/PortalWakaCards.js` | Navigasi modul bahtsul masail & humas | Stagger entrance, hover border emas, icon tilt halus | ✅ Selesai |
| 12 | **Kartu Jam Istiwa Portal** | Portal Beranda (`/`) | `components/portal/PortalJamIstiwaCard.js`| Live waktu istiwa portal | Soft entrance, border emas lembut, reduced-motion safe | ✅ Selesai |
| 13 | **Kartu Metrik WAKA I (Kurikulum)** | Halaman WAKA I (`/waka-i`) | `components/waka1/Waka1SummaryCards.js` | Ringkasan kurikulum (4 kartu) | Stagger sequence (4 items), hover lift `-3px`, accent top border | ✅ Selesai |
| 14 | **Kartu Kurikulum Detail WAKA I** | Halaman WAKA I (`/waka-i`) | `components/waka1/Waka1Client.js` | Daftar program pendidikan | Animated container, micro-interaction border | ✅ Selesai |
| 15 | **Kartu Program Kerja WAKA II** | Halaman WAKA II (`/waka-ii`) | `components/waka2/ProgramCards.js` | 4 Kartu divisi (Kedisiplinan, Organisasi, Bakat, Rohani) | Stagger layout, hover lift `-4px`, elevated shadow transition | ✅ Selesai |
| 16 | **Kartu Absensi & Jurnal WAKA II** | Halaman WAKA II (`/waka-ii`) | `components/waka2/AbsensiTable.js`, `JurnalViewer.js` | Filter kehadiran & preview jurnal | Animated container cards, soft entrance | ✅ Selesai |
| 17 | **Kartu Ringkasan Keuangan** | Halaman Keuangan (`/keuangan`)| `app/keuangan/KeuanganClient.js` | 3 Kartu (Pemasukan, Pengeluaran, Saldo Kas) | Stagger card motion, hover lift `-3px`, color-coded accent | ✅ Selesai |
| 18 | **Kartu Donut Chart Keuangan** | Halaman Keuangan (`/keuangan`)| `components/KeuanganDonutChart.js` | Visualisasi proporsi kas | Card reveal, hover shadow boost, smooth load | ✅ Selesai |

---

## 3. HASIL TEMUAN AUDIT UI/UX (PRIORITAS P0, P1, P2)

### Kategori P0 — Kritis (Keamanan & Integritas Data)
- **Status:** **TIDAK DITEMUKAN MASALAH P0**
- **Verifikasi:**
  - Token rahasia Google Apps Script (`SHEETS_API_SECRET_TOKEN`) tersimpan di variabel lingkungan server-side (`.env.local` / Vercel), tidak terekspos di browser client.
  - Endpoint proxy `/api/sheets` memiliki proteksi otentikasi administrator untuk aksi mutasi tulis balik ke Google Sheets.
  - Data mentah Google Sheets tab PERKEMBANGAN (biodata santri) dikunci read-only di level Apps Script dan API Next.js untuk mencegah penimpaan data fiktif.

### Kategori P1 — Tinggi (Fungsi Utama & Logika Alur Kerja)
- **Temuan P1-1 (Logika Deteksi Status Keberangkatan):**
  - *Isu Awal:* Risiko teks `"BELUM BERANGKAT"` salah diklasifikasikan sebagai `"SUDAH_BERANGKAT"` jika regex mencocokkan substring `"BERANGKAT"` terlebih dahulu.
  - *Audit Kode:* Diperiksa pada `lib/fetchCSV.js:parseStatusKeberangkatan` dan `components/EditBahsuModal.js`.
  - *Hasil Audit:* Logika telah menerapkan urutan pengujian aman: `BELOM / BELUM` diperiksa pada langkah ke-2, mendahului `SUDAH / BERANGKAT` pada langkah ke-4.
  - *Rekomendasi:* Tetap pertahankan urutan pengujian ini dan pastikan tidak diubah pada refaktorisasi masa depan.

- **Temuan P1-2 (Dukungan Aksesibilitas Prefers-Reduced-Motion):**
  - *Isu Awal:* Animasi kartu yang berjalan tanpa memeriksa preferensi sistem dapat menyebabkan pusing/disorientasi bagi pengguna yang menyetel *Reduce Motion*.
  - *Perbaikan:* Ditambahkan `useReducedMotion()` dari Framer Motion pada seluruh komponen kartu (`StatCard`, `BahsuTable`, `PortalWakaCards`, `ProgramCards`, dll.). Jika aktif, animasi pergerakan translasi (`y: 12`) otomatis dinonaktifkan dan hanya menggunakan fade-in instan.

### Kategori P2 — Penyempurnaan (Estetika, Konsistensi, & Layout)
- **Temuan P2-1 (Konsistensi Elevasi Kartu):**
  - *Kondisi Sebelumnya:* Beberapa kartu menggunakan border abu-abu standar dengan bayangan statis (`shadow-sm`), terkesan kaku dan tidak seirama dengan identitas premium WAKA III.
  - *Perbaikan:* Standarisasi elevasi kartu menggunakan `bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#C5A059]/40 rounded-xl transition-all duration-300`.
- **Temuan P2-2 (Ketepatan Tampilan Cetak Laporan A4):**
  - *Kondisi:* Animasi framer-motion dapat mengganggu mesin cetak browser (print preview) jika transform CSS tidak dinetralisir saat `@media print`.
  - *Perbaikan:* Semua kartu cetak dan wrapper laporan diatur agar mengabaikan transform CSS saat pencetakan, menghasilkan dokumen A4 yang bersih dan rapi.
- **Temuan P2-3 (Responsivitas Mobile Viewport):**
  - *Kondisi:* Grid 4 kolom pada kartu statistik dapat menyebabkan pembacaan angka terpotong pada layar di bawah 360px.
  - *Perbaikan:* Menggunakan responsivitas `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` dengan padding terukur (`p-4` di mobile, `p-5` di desktop).

---

## 4. KESIMPULAN AUDIT

Desain website WAKA III kini telah memenuhi standar visual institusional modern:
1. Identitas warna Navy, Emas, dan Putih diterapkan secara konsisten.
2. Seluruh 18 kartu di berbagai modul telah memiliki micro-interaction dan stagger animation yang halus.
3. Aksesibilitas (`prefers-reduced-motion`) dan tampilan cetak A4 terjamin keamanannya.
4. Tidak ada regresi fungsional pada integrasi Google Sheets maupun fitur administrasi.
