# 📌 CATATAN PANDUAN & SOP SINKRONISASI AGENDA BAHSU WAKA III
**Dokumentasi Resmi & Prosedur Operasional Standar (SOP) Pemulihan Data Mandiri**  
*Lokasi Dokumen: `waka3-app/CATATAN_SOP_SINKRONISASI_BAHSU.md`*  
*Terakhir Diperbarui: 21 Oktober 2026*

---

## 🎯 DAFTAR ISI CEPAT
1. [Solusi Cepat 1-Menit (Pertolongan Pertama)](#1-solusi-cepat-1-menit-pertolongan-pertama)
2. [Mengapa Terjadi Tidak Sinkron? (Penyebab Umum)](#2-mengapa-terjadi-tidak-sinkron-penyebab-umum)
3. [Langkah Demi Langkah Penanganan Masalah](#3-langkah-demi-langkah-penanganan-masalah)
   - [Langkah A: Tombol Darurat Sinkronisasi (`bersihkanDanSinkronUlang`)](#langkah-a-tombol-darurat-sinkronisasi-bersihkandansinkronulang)
   - [Langkah B: Melacak Nama Santri yang Typo/Salah Ketik (`jalankanDryRun`)](#langkah-b-melacak-nama-santri-yang-typosalah-ketik-jalankandryrun)
   - [Langkah C: Mengaktifkan Trigger Otomatis Ketik Sheets (`pasangTrigger`)](#langkah-c-mengaktifkan-trigger-otomatis-ketik-sheets-pasangtrigger)
4. [Tabel Referensi Fungsi di Google Apps Script](#4-tabel-referensi-fungsi-di-google-apps-script)
5. [Tabel 25 Nama Resmi Santri LBM (Anti-Typo & Proteksi)](#5-tabel-25-nama-resmi-santri-lbm-anti-typo--proteksi)
6. [Catatan Penting Seputar Website & Cache](#6-catatan-penting-seputar-website--cache)

---

## 1. Solusi Cepat 1-Menit (Pertolongan Pertama)

Jika suatu saat Anda melihat ada santri yang agendanya belum bertambah atau ada data tidak sinkron antara tab **DAFTAR PEMBERANGKATAN BAHSU** dan tab **PERKEMBANGAN (Kolom J)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Buka Google Sheets ➔ Klik 'Ekstensi' ➔ Klik 'Apps Script'              │
│ ➔ Pada menu pilihan atas, pilih: 'bersihkanDanSinkronUlang'            │
│ ➔ Klik tombol '▷ Jalankan' (Run)                                       │
│ ➔ Selesai! Seluruh data otomatis sinkron rapi tanpa menduplikasi data. │
└────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **Data Anda 100% Aman!**  
> Sistem ini memiliki proteksi **Idempoten & Anti-Duplikasi**. Menjalankan fungsi di atas berkali-kali **TIDAK AKAN** membuat baris agenda menjadi dobel/kembar.

---

## 2. Mengapa Terjadi Tidak Sinkron? (Penyebab Umum)

Ada 4 penyebab umum mengapa agenda belum muncul di profil santri:

1. **Typo / Beda Ejaan Nama Delegasi:**  
   Nama yang diketik di tab *DAFTAR PEMBERANGKATAN BAHSU* berbeda dengan nama resmi di tab *PERKEMBANGAN*.  
   *Contoh:* Mengetik `M. Thohir` atau `Muhammad Thohirr` padahal nama resminya adalah `Muhammad Thohir`.
2. **Delegasi Ditulis di Baris Bawahnya (Baris Lanjutan):**  
   Agenda besar sering kali memiliki banyak delegasi yang ditulis turun ke baris-baris berikutnya tanpa mengulang nama acara di Kolom B. (Kini sistem sudah otomatis membaca baris lanjutan ini).
3. **Trigger Otomatis Belum Terpasang:**  
   Jika Anda mengetik langsung di Google Sheets tetapi trigger otomatis belum diaktifkan, Sheets belum mengirimkan data ke Kolom J.
4. **Jeda Waktu Sinkronisasi Google Drive (1–2 Menit):**  
   Google Sheets membutuhkan jeda waktu sekitar 60–120 detik agar data publik CSV terbit ke server website.

---

## 3. Langkah Demi Langkah Penanganan Masalah

### Langkah A: Tombol Darurat Sinkronisasi (`bersihkanDanSinkronUlang`)
Gunakan fungsi ini jika Anda baru saja menambahkan banyak agenda atau ingin menyinkronkan seluruh lembar kerja dari baris awal sampai akhir sekaligus membersihkan data uji coba:

1. Buka spreadsheet Google Sheets Anda.
2. Di menu atas, klik **Ekstensi** $\rightarrow$ pilih **Apps Script**.
3. Di toolbar bagian atas editor kode (di samping tombol *Debug*), klik kotak dropdown fungsi:
   - Pilih: **`bersihkanDanSinkronUlang`** (atau **`jalankanSinkronNyata`**).
4. Klik tombol **▷ Jalankan** (Run).
5. Tunggu sekitar 5–10 detik hingga muncul status *"Eksekusi selesai"*.
6. Buka kembali sheet `PERKEMBANGAN` Kolom J — seluruh riwayat bahsu santri sudah lengkap terisi!

---

### Langkah B: Melacak Nama Santri yang Typo/Salah Ketik (`jalankanDryRun`)
Jika setelah menjalankan Langkah A masih ada santri yang jumlah kehadirannya belum bertambah, artinya nama delegasi di lembar kerja salah eja:

1. Di editor Apps Script, pada menu dropdown pilih:  
   👉 **`jalankanDryRun`**
2. Klik tombol **▷ Jalankan**.
3. Perhatikan panel **Log Eksekusi** di bagian bawah editor.
4. Cari tulisan berwarna kuning/oranye bertanda `[Peringatan]`:
   ```
   [Peringatan] Delegasi tidak cocok: 'M Thohirr' (Kandidat terdekat: LBM-002 Muhammad Thohir)
   ```
5. Buka tab `DAFTAR PEMBERANGKATAN BAHSU`, cari nama yang salah ketik tersebut, lalu perbaiki ejaannya sesuai nama resmi.
6. Jalankan kembali **`jalankanSinkronNyata`**.

---

### Langkah C: Mengaktifkan Trigger Otomatis Ketik Sheets (`pasangTrigger`)
Sistem dilengkapi fitur canggih di mana Anda **cukup mengetik biasa di Google Sheets**, dan Kolom J santri akan otomatis terisi sendiri:

1. Di editor Apps Script, pilih fungsi:  
   👉 **`pasangTrigger`**
2. Klik tombol **▷ Jalankan**.
3. Jika Google meminta izin (*Review Permissions*), klik **Lanjutkan** $\rightarrow$ **Buka Proyek (tidak aman)** $\rightarrow$ **Izinkan**.
4. Selesai! Mulai sekarang, setiap kali Anda selesai mengetik acara, tanggal, dan nama delegasi di spreadsheet:
   - Sistem akan otomatis mendeteksi santri terkait.
   - Kolom J santri langsung terisi riwayat baru.
   - Notifikasi pesan kecil (*toast*) akan muncul di pojok kanan bawah spreadsheet memberitahukan bahwa data berhasil disimpan.

---

## 4. Tabel Referensi Fungsi di Google Apps Script

Di editor Apps Script, telah disediakan tombol-tombol praktis siap pakai di menu dropdown atas:

| Nama Fungsi di Dropdown | Fungsi & Kegunaan | Apakah Mengubah Spreadsheet? | Kapan Digunakan? |
| :--- | :--- | :---: | :--- |
| **`bersihkanDanSinkronUlang`** | Membersihkan sisa data uji coba, membaca baris lanjutan, dan melengkapi Kolom J | ✅ Ya | Saat ingin menyinkronkan total semua agenda dan membersihkan data sampah. |
| **`jalankanSinkronNyata`** | Menulis seluruh agenda yang belum ada ke Kolom J santri terkait | ✅ Ya | Kapan saja ada agenda baru yang belum masuk ke profil santri. |
| **`jalankanDryRun`** | Simulasi pratinjau aman di layar Log (tanpa menulis apa pun ke lembar kerja) | ❌ Tidak | Untuk memeriksa apakah ada nama santri yang salah eja/typo. |
| **`pasangTrigger`** | Memasang pemicu otomatis agar setiap ketikan baru langsung tersimpan | ⚙️ Trigger | Cukup dijalankan 1 kali saja saat awal konfigurasi spreadsheet. |

---

## 5. Tabel 25 Nama Resmi Santri LBM (Anti-Typo & Proteksi)

Agar tidak terjadi kegagalan sinkronisasi, pastikan pengetikan nama di Kolom D (Delegasi) mengikuti panduan berikut:

| No | ID | Nama Resmi di Tab PERKEMBANGAN | Kelas | Variasi Penulisan yang Didukung / Catatan |
| :---: | :---: | :--- | :---: | :--- |
| 1 | LBM-001 | **Muhammad Aufilana Zulfa Hasan** | 3 ALIYAH | Aufilana, Aufi |
| 2 | LBM-002 | **Muhammad Thohir** | 3 ALIYAH | ⚠️ *Terproteksi: Tidak akan pernah tertukar dgn Muthohir* |
| 3 | LBM-003 | **M. Sabiqun Nasih** | 2 Aliyah | Moh. Sabiqun Nasich, Sabiqun |
| 4 | LBM-004 | **Izza Nur Muhammad** | 2 Aliyah | Izza Nur |
| 5 | LBM-005 | **Yusa’ Sya’bana** | 2 Aliyah | Yusa Sya'bana, Yusa |
| 6 | LBM-007 | **Muhammad Ziyada Fatan Tazkiya** | 1 ALIYAH | Ziyada Fatan, Ziyad |
| 7 | LBM-008 | **Abdul Hakim Ibnu Asyhari** | 1 ALIYAH | Abdul Hakim Ibnu Asyharii, Hakim |
| 8 | LBM-009 | **Jalaluddin Arrumy** | 1 ALIYAH | Jalaludin Arrumi, Arrumy |
| 9 | LBM-010 | **M. Aulia Azza Muzaka** | 1 ALIYAH | Azza Aulia, Azza Muzaka |
| 10 | LBM-011 | **Muhammad Muthohir** | 3 Tsanawiyah | ⚠️ *Terproteksi: Tidak akan pernah tertukar dgn Thohir* |
| 11 | LBM-012 | **Wahyu Afrizal** | 3 Tsanawiyah | Afrizal |
| 12 | LBM-013 | **Moh. Qolbu Lamyanam Asshufi** | 3 Tsanawiyah | Qolbun Lam Yanam, Qolbu Lamyanam |
| 13 | LBM-014 | **Atana Akhid Abdul Basith Mauludin** | 3 Tsanawiyah | Atana Akhid, Basith |
| 14 | LBM-015 | **Dandi Arma Yoga** | 3 Tsanawiyah | ⚠️ *Terproteksi: Berbeda dengan Dandi Fathur* |
| 15 | LBM-016 | **M. Ageng Ainul Yakin Yusuf** | 3 Tsanawiyah | Ageng Ainul Yakin |
| 16 | LBM-017 | **Muhammad Abdul Aziz** | 2 Tsanawiyah | Abdul Aziz |
| 17 | LBM-018 | **Ja'far Ali Mughni** | 2 Tsanawiyah | Jafar Ali Mughni |
| 18 | LBM-019 | **Abdulloh Yusuf** | 2 Tsanawiyah | Abdullah Yusuf |
| 19 | LBM-020 | **Muhammad Zidni `Ilman** | 2 Tsanawiyah | Zidni Ilman, Muhammad Zidni |
| 20 | LBM-021 | **Aghnial Rahma** | 2 Tsanawiyah | Aghnial |
| 21 | LBM-022 | **Dandi Fathur Rahman** | 2 Tsanawiyah | ⚠️ *Terproteksi: Berbeda dengan Dandi Arma* |
| 22 | LBM-023 | **Rendi Muhammad Agam Wijaya** | 2 Tsanawiyah | Rendi Agam, Rendi |
| 23 | LBM-024 | **Mohammad Firman Ananda Ardhiansah** | 2 Tsanawiyah | Firman Ananda |
| 24 | LBM-025 | **Mohammad Danish Sakuri** | 1 Tsanawiyah | Danish Sakuri |
| 25 | LBM-026 | **Saiq Mahasimuda** | 1 Tsanawiyah | Saiq |

> [!TIP]
> **Daftar yang Otomatis Dilewati (Tidak Perlu Dihapus):**  
> Pembina seperti `Bpk. Lukman Julianto`, `Bpk. Riqi Sofa`, `Bpk. Lutfi Ansori`, penanda komisi (`KOM A`, `KOM B`), dan tanda strip (`-`) **secara otomatis diabaikan** oleh sistem tanpa menimbulkan error.

---

## 6. Catatan Penting Seputar Website & Cache

1. **Tombol "Sinkronkan Data" di Website:**  
   Pada halaman website `/bahsu` dan `/anggota`, terdapat tombol **"Sinkronkan Data"**. Klik tombol ini untuk meminta website mengambil data terbaru dari Google Sheets.
2. **Jeda Waktu Google Drive (Publish to Web):**  
   Google Sheets yang dipublikasikan via CSV memiliki jeda pembaharuan server sekitar **1 sampai 2 menit**. Jadi jika setelah mengedit di spreadsheet website belum langsung berubah, tunggu 1 menit lalu klik tombol *Sinkronkan Data* atau tekan `Ctrl + F5` (Refresh).
3. **Penyimpanan Lokal:**  
   Catatan ini tersimpan permanen di folder kerja Anda:
   - `d:\WEB WAKA III\CATATAN_SOP_SINKRONISASI_BAHSU.md`
   - `d:\WEB WAKA III\CATATAN_SOP_SINKRONISASI_BAHSU.txt` (Dapat dibuka langsung dengan Notepad)
   - `d:\WEB WAKA III\waka3-app\PANDUAN_SINKRONISASI_BAHSU.md`
