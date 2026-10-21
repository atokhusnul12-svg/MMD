# PANDUAN LENGKAP & SOP SINKRONISASI AGENDA BAHSU WAKA III
**Sistem Sinkronisasi Otomatis Antara Tab DAFTAR PEMBERANGKATAN BAHSU & Tab PERKEMBANGAN (Kolom J)**

---

## 1. Arsitektur & Jalur Kerja Sistem

Sistem sinkronisasi agenda Bahtsul Masail WAKA III bekerja melalui **dua jalur ganda yang harmonis dan bebas benturan**:

1. **Jalur A — Melalui Tombol "Tambah Agenda" di Website:**
   * Pengguna mengisi formulir di halaman `/bahsu`.
   * Website mengirimkan data secara aman ke Web App Google Apps Script.
   * Google Apps Script menulis agenda ke tab `DAFTAR PEMBERANGKATAN BAHSU` sekaligus mencatatkannya ke Kolom J masing-masing santri di tab `PERKEMBANGAN`.
   * Cache server Next.js (`/anggota`, `/bahsu`, `/waka-iii`) otomatis di-refresh seketika.

2. **Jalur B — Mengetik / Edit Langsung di Google Sheets:**
   * Pengguna mengetik nama agenda (Kolom B), tanggal (Kolom C), dan delegasi (Kolom D) langsung di lembar kerja Google Sheets.
   * Trigger otomatis (`handleOnEditBahsu`) mendeteksi perubahan tersebut secara instan.
   * Sistem otomatis menuliskan riwayat ke Kolom J santri terkait di tab `PERKEMBANGAN` dan memunculkan notifikasi *toast* di pojok kanan bawah spreadsheet.

> [!NOTE]
> Kedua jalur di atas dilindungi oleh pengunci dokumen (`LockService 30 detik`) dan logika **anti-duplikasi idempoten**, sehingga tidak akan pernah menghasilkan baris kembar meskipun data dikirim atau disinkronkan berulang kali.

---

## 2. Aturan Penulisan Kolom J (BAHTSU YANG DIDATANGI)

* **Format Isi:** `<Kolom B>\t<Kolom C>`  
  Menggunakan pemisah karakter **Tab (`\t`)** persis format standar salin-tempel Google Sheets antar-kolom. Saat dibaca oleh website, karakter tab otomatis dirapikan menjadi satu spasi yang bersih.
* **Penempatan Baris:**  
  Entri baru selalu ditempatkan pada **baris kosong pertama tepat setelah baris terisi terakhir** di dalam sel santri. Jika sel tidak memiliki baris kosong di bawahnya, ditambahkan baris baru. Baris lama tidak pernah dihapus.
* **Baris Lanjutan (Continuation Rows):**  
  Jika suatu agenda memiliki delegasi yang ditulis memanjang ke baris-baris bawahnya (di mana Kolom B dan C sengaja dikosongkan), sistem secara cerdas membaca dan menggabungkan seluruh nama delegasi di baris-baris bawah tersebut.
* **Penyaringan Otomatis:**
  * Delegasi pembina/non-santri (seperti `Bpk. Lukman Julianto`, `Bpk. Riqi Sofa`, `Bpk. Lutfi Ansori`, dll) dilewati otomatis tanpa peringatan.
  * Penanda komisi (`KOM A`, `KOM B`, `KOMISI A`), tanda strip (`-`), dan `Semua Anggota LBM` dilewati secara otomatis.
* **Pencegahan Data Setengah-Jadi:**  
  Jika Anda mengetik bertahap di spreadsheet (misal baru mengisi nama acara di Kolom B, sedangkan Tanggal dan Delegasi belum diisi), sistem tidak akan menulis apa pun ke Kolom J sampai ketiga kolom tersebut terisi lengkap.

---

## 3. SOP Penanganan Jika Terjadi Ketidaksinkronan di Masa Depan

Jika suatu saat Anda merasa ada agenda baru yang belum masuk ke profil santri atau angka kehadiran di kartu santri belum bertambah, ikuti panduan praktis berikut:

### Langkah 1: Tombol Darurat 1-Klik (`jalankanSinkronNyata`)
Gunakan fungsi ini untuk melengkapi semua agenda yang belum tersinkron tanpa khawatir data lama rusak:
1. Buka spreadsheet Google Sheets Anda.
2. Klik menu **Ekstensi** $\rightarrow$ **Apps Script**.
3. Pada bilah atas (di samping tombol *Debug*), klik menu dropdown dan pilih:  
   👉 **`jalankanSinkronNyata`**
4. Klik tombol **▷ Jalankan (Run)**.
5. Selesai! Seluruh agenda dari baris pertama hingga terakhir akan diperiksa dan dilengkapi dalam beberapa detik.

### Langkah 2: Cek Nama Delegasi yang Tidak Cocok (`jalankanDryRun`)
Jika setelah Langkah 1 ada santri tertentu yang tetap belum masuk, penyebab utamanya adalah **perbedaan ejaan nama**:
1. Di editor Apps Script, pilih fungsi:  
   👉 **`jalankanDryRun`** $\rightarrow$ klik **▷ Jalankan**.
2. Buka tab **Log Eksekusi** di bagian bawah.
3. Skrip akan memberikan peringatan detail beserta saran kandidat santri yang mirip, misalnya:  
   *`[Peringatan] Delegasi tidak cocok: 'Muhammad Thohirr' (Kandidat: LBM-002 Muhammad Thohir)`*
4. Anda cukup memperbaiki salah ketik nama tersebut di sheet `DAFTAR PEMBERANGKATAN BAHSU`, lalu ulangi Langkah 1.

### Langkah 3: Mengaktifkan Kembali Trigger Edit Otomatis (`pasangTrigger`)
Jika Anda mengetik agenda baru di Google Sheets tetapi tidak muncul pesan notifikasi *toast* di pojok kanan bawah:
1. Di editor Apps Script, pilih fungsi:  
   👉 **`pasangTrigger`**
2. Klik tombol **▷ Jalankan**.
3. Sistem akan memverifikasi dan memastikan trigger edit langsung aktif kembali.

### Langkah 4: Pembersihan Data Uji Coba (`bersihkanDanSinkronUlang`)
Jika ada data uji coba atau baris verifikasi sementara yang ingin dibersihkan dari kedua sheet:
1. Di editor Apps Script, pilih fungsi:  
   👉 **`bersihkanDanSinkronUlang`**
2. Klik tombol **▷ Jalankan**.
3. Skrip akan otomatis menghapus baris "Uji Coba" dan "Verifikasi Otomatis" dari tab `DAFTAR PEMBERANGKATAN BAHSU` serta membersihkan entri riwayat uji dari Kolom J santri.

---

## 4. Ringkasan Menu Fungsi di Google Apps Script

| Nama Fungsi di Dropdown | Kegunaan Utama | Apakah Mengubah Spreadsheet? |
| :--- | :--- | :--- |
| **`jalankanDryRun`** | Simulasi pratinjau aman di Log Eksekusi | ❌ Tidak (100% Aman) |
| **`jalankanSinkronNyata`** | Menulis seluruh agenda yang belum ada ke Kolom J | ✅ Ya (Hanya menambah yang belum ada) |
| **`bersihkanDanSinkronUlang`** | Hapus baris uji coba + sinkron ulang penuh | ✅ Ya (Bersihkan uji coba & lengkapi data) |
| **`pasangTrigger`** | Pasang trigger onEdit otomatis di Google Sheets | ⚙️ Konfigurasi Trigger Proyek |

---

## 5. Daftar 25 Santri Resmi LBM & Proteksi Nama Mirip

Sistem dilengkapi algoritma penjodohan ketat untuk mencegah salah sasaran antar santri yang memiliki nama mirip:

| No | ID Anggota | Nama Lengkap Resmi | Kelas | Catatan Proteksi Nama |
| :---: | :---: | :--- | :--- | :--- |
| 1 | LBM-001 | Muhammad Aufilana Zulfa Hasan | 3 ALIYAH | - |
| 2 | LBM-002 | **Muhammad Thohir** | 3 ALIYAH | Terproteksi: Tidak pernah tertukar dgn Muthohir |
| 3 | LBM-003 | M. Sabiqun Nasih | 2 Aliyah | Alias: Moh. Sabiqun Nasich |
| 4 | LBM-004 | Izza Nur Muhammad | 2 Aliyah | - |
| 5 | LBM-005 | Yusa’ Sya’bana | 2 Aliyah | - |
| 7 | LBM-007 | Muhammad Ziyada Fatan Tazkiya | 1 ALIYAH | - |
| 8 | LBM-008 | Abdul Hakim Ibnu Asyhari | 1 ALIYAH | Alias: Abdul Hakim Ibnu Asyharii |
| 9 | LBM-009 | Jalaluddin Arrumy | 1 ALIYAH | Baris ganda eksisting tetap terjaga |
| 10 | LBM-010 | M. Aulia Azza Muzaka | 1 ALIYAH | Alias: Azza Aulia |
| 11 | LBM-011 | **Muhammad Muthohir** | 3 Tsanawiyah | Terproteksi: Tidak pernah tertukar dgn Thohir |
| 12 | LBM-012 | Wahyu Afrizal | 3 Tsanawiyah | - |
| 13 | LBM-013 | Moh. Qolbu Lamyanam Asshufi | 3 Tsanawiyah | Alias: Qolbun Lam Yanam |
| 14 | LBM-014 | Atana Akhid Abdul Basith Mauludin | 3 Tsanawiyah | - |
| 15 | LBM-015 | Dandi Arma Yoga | 3 Tsanawiyah | Terproteksi: Berbeda dengan Dandi Fathur |
| 16 | LBM-016 | M. Ageng Ainul Yakin Yusuf | 3 Tsanawiyah | - |
| 17 | LBM-017 | Muhammad Abdul Aziz | 2 Tsanawiyah | - |
| 18 | LBM-018 | Ja'far Ali Mughni | 2 Tsanawiyah | - |
| 19 | LBM-019 | Abdulloh Yusuf | 2 Tsanawiyah | - |
| 20 | LBM-020 | Muhammad Zidni `Ilman | 2 Tsanawiyah | - |
| 21 | LBM-021 | Aghnial Rahma | 2 Tsanawiyah | - |
| 22 | LBM-022 | Dandi Fathur Rahman | 2 Tsanawiyah | Terproteksi: Berbeda dengan Dandi Arma |
| 23 | LBM-023 | Rendi Muhammad Agam Wijaya | 2 Tsanawiyah | - |
| 24 | LBM-024 | Mohammad Firman Ananda Ardhiansah | 2 Tsanawiyah | - |
| 25 | LBM-025 | Mohammad Danish Sakuri | 1 Tsanawiyah | - |
| 26 | LBM-026 | Saiq Mahasimuda | 1 Tsanawiyah | - |

---

## 6. Penyesuaian Tampilan Website (Jeda Pembaruan)

* **Tombol "Sinkronkan Data":**  
  Pada halaman `/bahsu` dan `/anggota`, terdapat tombol penyegar data. Klik tombol tersebut untuk memaksa browser mengambil data terbaru langsung dari Google Sheets.
* **Jeda Pembaruan CSV Google Drive:**  
  Jika Anda mengedit langsung di spreadsheet, Google Drive membutuhkan jeda sekitar **1 menit** untuk memperbarui file CSV publiknya. Setelah jeda tersebut, muat ulang (*refresh*) halaman website untuk melihat data paling mutakhir.
