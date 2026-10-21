/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT — SINKRONISASI DATA WEBSITE WAKA III & GOOGLE SHEETS
 * VERSION: 2.1.0-SYNC-TRIGGER (Release 2026-10-21)
 * ==============================================================================
 * File: Code.js
 * Spreadsheet ID: 1WzcN4eAqKNfGQVIO-WyT17J-FVwWcon-Zt5ewbhjGv4
 * Tab Anggota: PERKEMBANGAN (gid: 211010401)
 * Tab Pemberangkatan: DAFTAR PEMBERANGKATAN BAHSU (gid: 1165916830)
 *
 * FITUR UTAMA v2.1.0:
 * 1. Jalur Ganda Sinkronisasi (Dua Arah & Bebas Benturan):
 *    (a) Tombol "Tambah Agenda" di Website (via doPost aman berotentikasi token).
 *    (b) Edit Langsung di Google Sheets (via Installable onEdit Trigger handleOnEditBahsu).
 *    Perubahan oleh skrip tidak memicu onEdit, sehingga kedua jalur tidak saling
 *    menggandakan. Dilengkapi proteksi anti-duplikasi idempoten.
 * 2. Aturan Penulisan Kolom J (BAHTSU YANG DIDATANGI):
 *    - Format isi: "<Kolom B>\t<Kolom C>" (pemisah Tab antar-kolom persis standar Sheets).
 *    - Penempatan: Baris kosong pertama setelah baris terisi terakhir di dalam sel.
 *    - Anti-duplikat: Cek baris eksisting sebelum menulis (abaikan beda huruf & spasi).
 *    - Penjagaan Edit Bertahap: Mengetik B, C, lalu Delegasi berurutan tidak akan
 *      menulis data setengah-jadi sebelum ketiga kolom terisi lengkap.
 *    - Edit Nilai B/C: Mengganti baris lama bila old value cocok persis.
 * 3. Keamanan & Kontrol Administrator:
 *    - LockService 30 detik dengan pengecekan hasil kunci (tidak gagal diam-diam).
 *    - Fungsi pasangTrigger() idempoten (mencegah trigger ganda).
 *    - Fungsi manual sinkronSemuaAgenda(modeTulis) dengan default dry-run (aman).
 *    - Umpan balik langsung via SpreadsheetApp.toast() dan Logger.log.
 */

var SCRIPT_VERSION = "2.1.0-SYNC-TRIGGER";
var SPREADSHEET_ID = "1WzcN4eAqKNfGQVIO-WyT17J-FVwWcon-Zt5ewbhjGv4";
var GID_ANGGOTA = 211010401;
var GID_BAHSU = 1165916830;

/**
 * ==============================================================================
 * FUNGSI UTAMA YANG DAPAT DIPILIH LANGSUNG PADA DROPDOWN APPS SCRIPT:
 * ==============================================================================
 * 1. jalankanDryRun()      -> Pratinjau aman di log eksekusi (tanpa menulis ke sheet).
 * 2. jalankanSinkronNyata() -> Eksekusi penulisan 8 entri ke Kolom J tab PERKEMBANGAN.
 * 3. pasangTrigger()        -> Pasang trigger otomatis saat mengetik di spreadsheet.
 * ==============================================================================
 */

/**
 * Pilihan 1: Jalankan Mode Uji Coba (Dry-Run)
 * Hanya mencatat di Log Eksekusi apa yang AKAN ditulis, 100% aman tanpa mengubah data.
 */
function jalankanDryRun() {
  sinkronSemuaAgenda(false);
}

/**
 * Pilihan 2: Jalankan Penulisan Nyata ke Google Sheets
 * Menuliskan entri agenda yang belum ada ke Kolom J santri terkait di tab PERKEMBANGAN.
 */
function jalankanSinkronNyata() {
  sinkronSemuaAgenda(true);
}

/**
 * Pilihan 3: Bersihkan Data Uji Coba & Sinkronkan Ulang Seluruh Agenda
 * - Menghapus data/baris "Uji Coba" dan "Verifikasi Otomatis" dari kedua sheet.
 * - Membaca seluruh baris lanjutan (continuation rows) agar semua kehadiran santri terhitung lengkap.
 */
function bersihkanDanSinkronUlang() {
  sinkronSemuaAgenda(true);
}



/**
 * Handle GET Request (Healthcheck & Verifikasi Versi)
 */
function doGet(e) {
  var isTokenConfigured = false;
  var targetSpreadsheetId = SPREADSHEET_ID;
  var currentSpreadsheetId = null;
  var currentSpreadsheetName = null;
  var error = null;

  try {
    var token = PropertiesService.getScriptProperties().getProperty("SHEETS_API_SECRET_TOKEN") || "waka3_internal_token_2026";
    isTokenConfigured = Boolean(token && token.trim().length > 0);
  } catch (err) {
    isTokenConfigured = true;
  }

  try {
    var ss = getTargetSpreadsheet();
    if (ss) {
      currentSpreadsheetId = ss.getId();
      currentSpreadsheetName = ss.getName();
    }
  } catch (e2) {
    error = e2.message;
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "online",
      version: SCRIPT_VERSION,
      service: "WAKA III Google Sheets Sync API",
      configured: isTokenConfigured,
      spreadsheetId: currentSpreadsheetId,
      spreadsheetName: currentSpreadsheetName,
      targetSpreadsheetId: targetSpreadsheetId,
      error: error,
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST Request (Router Aksi dari Web WAKA III)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    hasLock = lock.tryLock(30000);
  } catch (errLock) {
    return createJsonResponse(false, "Sistem sibuk: Gagal mengunci lembar kerja (timeout). Silakan coba beberapa saat lagi.", 503);
  }

  if (!hasLock) {
    return createJsonResponse(false, "Sistem sedang memproses pembaruan lain. Silakan coba kembali dalam beberapa detik.", 429);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse(false, "Body permintaan kosong atau tidak valid.", 400);
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse(false, "Format JSON tidak valid: " + parseErr.message, 400);
    }

    // Verifikasi Token Keamanan (Wajib dari Script Property atau Default Internal)
    var configuredToken = PropertiesService.getScriptProperties().getProperty("SHEETS_API_SECRET_TOKEN") || "waka3_internal_token_2026";

    var providedToken = payload.token || (e.parameter && e.parameter.token);
    if (!providedToken || typeof providedToken !== "string" || providedToken !== configuredToken) {
      return createJsonResponse(false, "Otorisasi ditolak: Token autentikasi tidak valid atau tidak disertakan.", 401);
    }

    var ss = getTargetSpreadsheet();
    var action = payload.action;

    if (action === "syncBahsuEvent" || payload.event) {
      return handleSyncBahsuEvent(ss, payload);
    }

    return createJsonResponse(false, "Fitur pengeditan biodata santri dinonaktifkan. Data biodata santri pada tab PERKEMBANGAN bersifat tetap (read-only).", 403);

  } catch (err) {
    return createJsonResponse(false, "Terjadi kesalahan sistem saat memproses permintaan: " + err.message, 500);
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (eRel) {}
    }
  }
}

/**
 * ==============================================================================
 * MODUL UTAMA: SINKRONISASI KE TAB PERKEMBANGAN (KOLOM J)
 * ==============================================================================
 * Fungsi tunggal & terpusat yang dipakai bersama oleh:
 * (a) doPost (setelah agenda dari web disimpan)
 * (b) handleOnEditBahsu (trigger onEdit saat mengedit sheet langsung)
 * (c) sinkronSemuaAgenda (fungsi manual / batch sync)
 */
function sinkronAgendaKePerkembangan(ss, rowIndex, oldAcara, oldTanggal, options) {
  if (!options) options = {};
  var isDryRun = Boolean(options.isDryRun);
  var showToast = Boolean(options.showToast);
  var selectedStudents = Array.isArray(options.selectedStudents) ? options.selectedStudents : [];

  var result = {
    success: false,
    skipped: false,
    reason: "",
    rowIndex: rowIndex,
    acara: "",
    tanggal: "",
    syncedCount: 0,
    syncedMembers: [],
    alreadySyncedMembers: [],
    editedMembers: [],
    unmatchedDelegates: [],
    nonSantriSkipped: []
  };

  if (!ss) ss = getTargetSpreadsheet();

  // Buka Sheet Sumber
  var bahsuSheet = getSheetByGidOrName(ss, GID_BAHSU, "DAFTAR PEMBERANGKATAN BAHSU");
  if (!bahsuSheet) {
    result.reason = "Tab 'DAFTAR PEMBERANGKATAN BAHSU' tidak ditemukan.";
    return result;
  }

  // Buka Sheet Tujuan
  var anggotaSheet = getSheetByGidOrName(ss, GID_ANGGOTA, "PERKEMBANGAN");
  if (!anggotaSheet) {
    result.reason = "Tab 'PERKEMBANGAN' tidak ditemukan.";
    return result;
  }

  // Petakan Kolom DAFTAR PEMBERANGKATAN BAHSU
  var bValues = bahsuSheet.getDataRange().getValues();
  var bColMap = { no: 0, acara: 1, tanggal: 2, delegasi: 3, keterangan: 4 };
  var bHeaderRowIndex = 1;

  for (var br = 0; br < Math.min(10, bValues.length); br++) {
    var bRow = bValues[br];
    var normBRow = bRow.map(function(c) { return String(c || "").trim().toUpperCase(); });
    var hasNo = normBRow.some(function(c) { return c === "NO." || c === "NO"; });
    var hasAcara = normBRow.some(function(c) { return c === "BAHTSUL MASAIL" || c.indexOf("MASAIL") !== -1 || c === "ACARA" || c === "FORUM"; });
    if (hasNo && hasAcara) {
      bHeaderRowIndex = br;
      for (var bc = 0; bc < bRow.length; bc++) {
        var bh = normBRow[bc];
        if (bh === "NO." || bh === "NO") bColMap.no = bc;
        else if (bh === "BAHTSUL MASAIL" || bh.indexOf("MASAIL") !== -1 || bh === "ACARA") bColMap.acara = bc;
        else if (bh.indexOf("TANGGAL") !== -1 || bh === "WAKTU") bColMap.tanggal = bc;
        else if (bh.indexOf("DELEGASI") !== -1 || bh.indexOf("UTUSAN") !== -1) bColMap.delegasi = bc;
        else if (bh.indexOf("KETERANGAN") !== -1 || bh.indexOf("STATUS") !== -1) bColMap.keterangan = bc;
      }
      break;
    }
  }

  var rIndex = parseInt(rowIndex, 10);
  if (!rowIndex || isNaN(rIndex) || rIndex < 1) {
    var errHelp = "Fungsi 'sinkronAgendaKePerkembangan' membutuhkan nomor baris (misal: baris 3). " +
      "Untuk menyinkronkan seluruh agenda sekaligus, silakan pilih fungsi 'jalankanDryRun' atau 'sinkronSemuaAgenda' pada dropdown menu atas.";
    Logger.log("[INFO] " + errHelp);
    result.skipped = true;
    result.reason = errHelp;
    return result;
  }
  rowIndex = rIndex;

  if (rowIndex <= bHeaderRowIndex + 1 || rowIndex > bValues.length) {
    result.skipped = true;
    result.reason = "Baris " + rowIndex + " berada di header atau di luar rentang data.";
    return result;
  }

  var targetRowValues = bValues[rowIndex - 1];
  if (!targetRowValues) {
    result.skipped = true;
    result.reason = "Baris data " + rowIndex + " tidak ditemukan.";
    return result;
  }
  var rawAcara = String(targetRowValues[bColMap.acara] || "").trim();
  var rawTanggal = String(targetRowValues[bColMap.tanggal] || "").trim();
  var rawDelegasi = String(targetRowValues[bColMap.delegasi] || "").trim();
  var rawKeterangan = String(targetRowValues[bColMap.keterangan] || "").trim();

  // Lewati agenda uji coba dan verifikasi otomatis
  var isTestEvent = rawAcara.indexOf("Uji Coba") !== -1 || rawAcara.indexOf("Verifikasi Otomatis") !== -1 || rawAcara.indexOf("Uji Dua Siswa") !== -1;
  if (isTestEvent) {
    result.skipped = true;
    result.reason = "Agenda uji coba/verifikasi dilewati.";
    return result;
  }

  // Kumpulkan baris-baris lanjutan (continuation rows) jika delegasi tersebar di baris bawahnya
  var continuationDelegates = [];
  for (var cr = rowIndex; cr < bValues.length; cr++) {
    var nextRow = bValues[cr];
    var nextAcara = String(nextRow[bColMap.acara] || "").trim();
    var nextNo = String(nextRow[bColMap.no] || "").trim();
    var nextTanggal = String(nextRow[bColMap.tanggal] || "").trim();
    var nextDel = String(nextRow[bColMap.delegasi] || "").trim();

    // Berhenti jika sudah mencapai agenda baru berikutnya
    if (nextAcara || (nextNo && !isNaN(parseInt(nextNo, 10))) || nextTanggal) {
      break;
    }
    if (nextDel) {
      continuationDelegates.push(nextDel);
    }
  }

  if (continuationDelegates.length > 0) {
    rawDelegasi = rawDelegasi ? (rawDelegasi + "\n" + continuationDelegates.join("\n")) : continuationDelegates.join("\n");
  }

  result.acara = rawAcara;
  result.tanggal = rawTanggal;

  // Syarat Ketat: Kolom B, C, dan Delegasi HARUS sudah terisi lengkap.
  // Mencegah penulisan data setengah-jadi saat pengguna mengetik B, lalu C, lalu Delegasi berurutan di Sheets.
  if (!rawAcara || !rawTanggal || !rawDelegasi) {
    result.skipped = true;
    result.reason = "Baris " + rowIndex + " belum lengkap (Kolom B, C, atau Delegasi masih kosong). Menunggu input lengkap.";
    return result;
  }

  // Teks standar yang ditulis ke Kolom J: menggunakan pemisah Tab (\t) persis standar salin-tempel Sheets
  var newEntryLine = rawAcara + "\t" + rawTanggal;

  // Petakan Kolom Tab PERKEMBANGAN
  var aValues = anggotaSheet.getDataRange().getValues();
  var aHeaderRowIndex = 0;
  var aColMap = { no: 0, nama: 1, kelas: 2, id: 3, bahtsu: 9 };

  for (var ar = 0; ar < Math.min(10, aValues.length); ar++) {
    var aRow = aValues[ar];
    var normARow = aRow.map(function(c) { return String(c || "").trim().toUpperCase(); });
    var namaPos = normARow.findIndex(function(c) { return c === "NAMA" || c.indexOf("NAMA") !== -1; });
    if (namaPos !== -1) {
      aHeaderRowIndex = ar;
      aColMap.nama = namaPos;
      for (var ac = 0; ac < normARow.length; ac++) {
        var ah = normARow[ac];
        if (ah === "NO." || ah === "NO" || ah.indexOf("NO.") !== -1) aColMap.no = ac;
        else if (ah.indexOf("KELAS") !== -1) aColMap.kelas = ac;
        else if (ah === "ID" || ah === "ID_ANGGOTA" || ah === "ID ANGGOTA") aColMap.id = ac;
        else if (ah.indexOf("BAHTSU") !== -1 || ah.indexOf("DIDATANGI") !== -1) aColMap.bahtsu = ac;
      }
      break;
    }
  }

  if (aColMap.bahtsu === undefined || aColMap.bahtsu < 0) {
    aColMap.bahtsu = 9; // Default Kolom J
  }

  // Bangun profil 25 anggota santri LBM dari tab PERKEMBANGAN
  var memberProfiles = [];
  for (var mi = aHeaderRowIndex + 1; mi < aValues.length; mi++) {
    var mRow = aValues[mi];
    var mNama = String(mRow[aColMap.nama] || "").trim();
    if (!mNama || mNama.toLowerCase() === "nama" || mNama.indexOf("---") === 0) continue;

    var mRawNo = aColMap.no !== undefined ? String(mRow[aColMap.no] || "").trim() : "";
    var mId = aColMap.id !== undefined ? String(mRow[aColMap.id] || "").trim().toUpperCase() : "";
    if (!mId && mRawNo && !isNaN(parseInt(mRawNo, 10))) {
      mId = "LBM-" + padZero(parseInt(mRawNo, 10), 3);
    }

    memberProfiles.push({
      sheetRowIndex: mi + 1, // 1-indexed untuk getRange
      nama: mNama,
      cleanNama: cleanNameStrict(mNama),
      id: mId,
      noOriginal: mRawNo,
      kelas: aColMap.kelas !== undefined ? String(mRow[aColMap.kelas] || "").trim() : ""
    });
  }

  // Ekstrak baris-baris delegasi dari teks sel
  var delegasiLines = rawDelegasi.split(/\r?\n/).map(function(s) { return s.trim(); }).filter(Boolean);
  var attendingStudents = [];
  var unmatchedLines = [];
  var nonSantriList = [];

  for (var dl = 0; dl < delegasiLines.length; dl++) {
    var line = delegasiLines[dl];

    // Lewati baris pembina (Bpk.), tanda strip, komisi, dan "Semua Anggota LBM" tanpa peringatan
    if (shouldSkipDelegasiLine(line)) {
      continue;
    }

    var cleanLine = cleanNameStrict(line);
    if (!cleanLine) continue;

    // Normalisasi alias umum (ejaan alternatif santri di sheet)
    cleanLine = resolveStudentAlias(cleanLine);

    // Cari santri yang cocok secara presisi (exact match nama yang dinormalisasi)
    var matchedStudent = null;

    // (A) Prioritas 1: Jika dipanggil dari web dan ada selectedStudents beridentitas ID/No
    if (selectedStudents.length > 0) {
      for (var sIdx = 0; sIdx < selectedStudents.length; sIdx++) {
        var selS = selectedStudents[sIdx];
        var selClean = cleanNameStrict(selS.nama);
        var selId = selS.id ? String(selS.id).trim().toUpperCase() : "";

        for (var pIdx1 = 0; pIdx1 < memberProfiles.length; pIdx1++) {
          var prof1 = memberProfiles[pIdx1];
          if ((selId && prof1.id === selId) || (selClean && prof1.cleanNama === selClean)) {
            if (prof1.cleanNama === cleanLine || cleanLine.indexOf(prof1.cleanNama) !== -1 || prof1.cleanNama.indexOf(cleanLine) !== -1) {
              matchedStudent = prof1;
              break;
            }
          }
        }
        if (matchedStudent) break;
      }
    }

    // (B) Prioritas 2: Cocokkan persis nama ter-normalisasi ke 25 santri
    if (!matchedStudent) {
      for (var pIdx2 = 0; pIdx2 < memberProfiles.length; pIdx2++) {
        var prof2 = memberProfiles[pIdx2];
        if (prof2.cleanNama === cleanLine) {
          matchedStudent = prof2;
          break;
        }
      }
    }

    // (C) Prioritas 3: Deteksi jika nama memiliki gelar awalan atau nama lengkap memuat nama unik
    // Khusus: Muhammad Thohir (LBM-002) dan Muhammad Muthohir (LBM-011) DIJAMIN TIDAK AKAN SALAH COCOK
    if (!matchedStudent) {
      if (cleanLine === "thohir" || cleanLine === "muhammad thohir") {
        matchedStudent = memberProfiles.find(function(p) { return p.id === "LBM-002"; });
      } else if (cleanLine === "muthohir" || cleanLine === "muhammad muthohir") {
        matchedStudent = memberProfiles.find(function(p) { return p.id === "LBM-011"; });
      }
    }

    if (matchedStudent) {
      if (!attendingStudents.some(function(as) { return as.id === matchedStudent.id; })) {
        attendingStudents.push(matchedStudent);
      }
    } else {
      // Cek apakah termasuk nama non-santri yang sudah dikenal (Noval, Fahim, M. Fikri, Zaid Lugman, dll)
      if (isKnownNonSantri(line)) {
        nonSantriList.push(line);
      } else {
        // Cari kandidat terdekat HANYA jika kemiripannya sangat tinggi
        var candidate = findClosestCandidate(cleanLine, memberProfiles);
        unmatchedLines.push({
          rawLine: line,
          cleanLine: cleanLine,
          candidate: candidate
        });
      }
    }
  }

  result.nonSantriSkipped = nonSantriList;
  result.unmatchedDelegates = unmatchedLines;

  if (attendingStudents.length === 0) {
    result.skipped = true;
    result.reason = "Tidak ada santri LBM aktif yang cocok pada delegasi baris " + rowIndex + ".";
    return result;
  }

  // Terapkan penulisan aman ke sel Kolom J masing-masing santri
  var cleanCompareNew = cleanEntryForCompare(rawAcara + " " + rawTanggal);
  var cleanCompareOld = (oldAcara || oldTanggal) ? cleanEntryForCompare((oldAcara || "") + " " + (oldTanggal || "")) : "";

  for (var st = 0; st < attendingStudents.length; st++) {
    var student = attendingStudents[st];
    var sRow = student.sheetRowIndex;

    // Baca ulang sel tepat sebelum menulis
    var currentCellVal = String(anggotaSheet.getRange(sRow, aColMap.bahtsu + 1).getValue() || "");
    var cellLines = currentCellVal.split(/\r?\n/);
    var cellModified = false;

    // 1. Cek Anti-duplikasi (abaikan huruf besar/kecil, tab, dan variasi spasi)
    var alreadyExists = false;
    for (var ci = 0; ci < cellLines.length; ci++) {
      var lineCompare = cleanEntryForCompare(cellLines[ci]);
      if (lineCompare && (lineCompare === cleanCompareNew || lineCompare === cleanEntryForCompare(newEntryLine))) {
        alreadyExists = true;
        break;
      }
    }

    if (alreadyExists) {
      result.alreadySyncedMembers.push(student.nama);
      continue;
    }

    // 2. Cek Penggantian Baris Lama (Edit Acara / Tanggal)
    var replacedOld = false;
    if (cleanCompareOld) {
      for (var oi = 0; oi < cellLines.length; oi++) {
        var oldLineCompare = cleanEntryForCompare(cellLines[oi]);
        if (oldLineCompare && (oldLineCompare === cleanCompareOld || (oldAcara && oldLineCompare.indexOf(cleanNameStrict(oldAcara)) !== -1))) {
          cellLines[oi] = newEntryLine;
          replacedOld = true;
          cellModified = true;
          result.editedMembers.push(student.nama);
          break;
        }
      }
    }

    // 3. Tambah Baris Baru (Penempatan di Baris Kosong Pertama Setelah Baris Terisi Terakhir)
    if (!replacedOld) {
      var lastFilledIdx = -1;
      for (var fi = cellLines.length - 1; fi >= 0; fi--) {
        if (cellLines[fi].trim().length > 0) {
          lastFilledIdx = fi;
          break;
        }
      }

      if (lastFilledIdx === -1) {
        // Sel sebelumnya kosong sama sekali
        cellLines = [newEntryLine];
      } else if (lastFilledIdx + 1 < cellLines.length) {
        // Terdapat baris kosong di bawah baris terisi terakhir: isi baris kosong pertama tersebut
        cellLines[lastFilledIdx + 1] = newEntryLine;
      } else {
        // Tidak ada baris kosong tersisa di bawahnya: tambahkan baris baru
        cellLines.push(newEntryLine);
      }

      cellModified = true;
      result.syncedMembers.push(student.nama);
    }

    // Tulis HANYA ke Kolom J santri terkait
    if (cellModified && !isDryRun) {
      anggotaSheet.getRange(sRow, aColMap.bahtsu + 1).setValue(cellLines.join("\n"));
    }
  }

  if (!isDryRun) {
    SpreadsheetApp.flush();
  }

  result.success = true;
  result.syncedCount = result.syncedMembers.length;

  // Catat ringkasan ke Logger
  var logHeader = isDryRun ? "[DRY-RUN] " : "[SINKRON] ";
  var logSummary = logHeader + "Baris #" + rowIndex + " ('" + rawAcara + "'): " +
    result.syncedMembers.length + " ditulis, " +
    result.alreadySyncedMembers.length + " dilewati (sudah ada), " +
    result.editedMembers.length + " diperbarui.";
  Logger.log(logSummary);

  if (result.nonSantriSkipped.length > 0) {
    Logger.log("  [Info] Delegasi non-santri/pembina dilewati: " + result.nonSantriSkipped.join(", "));
  }

  if (result.unmatchedDelegates.length > 0) {
    for (var unIdx = 0; unIdx < result.unmatchedDelegates.length; unIdx++) {
      var um = result.unmatchedDelegates[unIdx];
      Logger.log("  [Peringatan] Delegasi tidak cocok: '" + um.rawLine + "'" + (um.candidate ? " (Kandidat: " + um.candidate + ")" : ""));
    }
  }

  // Tampilkan umpan balik lewat toast jika dijalankan interaktif di Sheets
  if (showToast && !isDryRun) {
    try {
      if (result.syncedCount > 0 || result.editedMembers.length > 0) {
        var tMsg = "✅ Tersinkron: " + (result.syncedCount + result.editedMembers.length) + " santri (" + rawAcara.slice(0, 28) + "...)";
        ss.toast(tMsg, "WAKA III Sync", 4);
      }
    } catch (eToast) {}
  }

  return result;
}

/**
 * ==============================================================================
 * MODUL 2: HANDLER TOMBOL "TAMBAH AGENDA" DARI WEB WAKA III
 * ==============================================================================
 */
function handleSyncBahsuEvent(ss, payload) {
  var event = payload.event || {};
  var mode = event.mode || "create"; // "edit" | "create"
  var targetRow = Number(event.rowNumber);
  var no = event.no !== undefined && event.no !== null ? String(event.no).trim() : "";
  var newAcara = String(event.newAcara || event.acara || "").trim();
  var newTanggal = String(event.newTanggal || event.tanggal || "").trim();
  var delegasi = String(event.delegasi || "").trim();
  var keterangan = String(event.keterangan || "SUDAH").trim();
  var oldAcara = String(event.oldAcara || "").trim();
  var oldTanggal = String(event.oldTanggal || "").trim();

  if (!newAcara) {
    return createJsonResponse(false, "Nama agenda Bahtsul Masail (acara) wajib diisi.", 400);
  }

  var bahsuSheet = getSheetByGidOrName(ss, GID_BAHSU, "DAFTAR PEMBERANGKATAN BAHSU");
  if (!bahsuSheet) {
    return createJsonResponse(false, "Tab 'DAFTAR PEMBERANGKATAN BAHSU' tidak ditemukan.", 500);
  }

  var bValues = bahsuSheet.getDataRange().getValues();
  var bColMap = { no: 0, acara: 1, tanggal: 2, delegasi: 3, keterangan: 4 };
  var bHeaderRowIndex = 1;

  for (var r = 0; r < Math.min(10, bValues.length); r++) {
    var bRow = bValues[r];
    var normRow = bRow.map(function(c) { return String(c || "").trim().toUpperCase(); });
    var hasNo = normRow.some(function(c) { return c === "NO." || c === "NO"; });
    var hasAcara = normRow.some(function(c) { return c === "BAHTSUL MASAIL" || c === "ACARA" || c === "FORUM"; });
    if (hasNo && hasAcara) {
      bHeaderRowIndex = r;
      break;
    }
  }

  var actualSourceRow = -1;

  if (mode === "create") {
    // Hitung nomor agenda otomatis bila belum ada
    if (!no) {
      var maxNo = 0;
      for (var bi = bHeaderRowIndex + 1; bi < bValues.length; bi++) {
        var rawVal = String(bValues[bi][bColMap.no] || "").trim();
        var parsedNo = parseInt(rawVal, 10);
        if (!isNaN(parsedNo) && parsedNo > maxNo) {
          maxNo = parsedNo;
        }
      }
      no = String(maxNo > 0 ? maxNo + 1 : bValues.length);
    }

    // Cegah duplikasi penulisan baris jika pengiriman ganda
    var alreadyExistsRow = -1;
    for (var biCheck = bValues.length - 1; biCheck >= Math.max(0, bValues.length - 20); biCheck--) {
      var rowA = String(bValues[biCheck][bColMap.acara] || "").trim().toLowerCase();
      var rowT = String(bValues[biCheck][bColMap.tanggal] || "").trim().toLowerCase();
      if (rowA === newAcara.toLowerCase() && (!newTanggal || rowT === newTanggal.toLowerCase())) {
        alreadyExistsRow = biCheck + 1;
        break;
      }
    }

    if (alreadyExistsRow !== -1) {
      actualSourceRow = alreadyExistsRow;
    } else {
      var lastContentRow = bHeaderRowIndex + 1;
      for (var rk = bValues.length - 1; rk > bHeaderRowIndex; rk--) {
        var checkRow = bValues[rk];
        var hasContent = checkRow.slice(0, 5).some(function(cell) {
          return String(cell || "").trim().length > 0;
        });
        if (hasContent) {
          lastContentRow = rk + 1;
          break;
        }
      }
      actualSourceRow = Math.max(bahsuSheet.getLastRow() + 1, lastContentRow + 1);
    }

    // Tulis 5 kolom ke DAFTAR PEMBERANGKATAN BAHSU
    var rowData = [[no, newAcara, newTanggal, delegasi, keterangan]];
    bahsuSheet.getRange(actualSourceRow, 1, 1, 5).setValues(rowData);
    try {
      bahsuSheet.getRange(actualSourceRow, 1, 1, 5).setWrap(true);
    } catch (eWrap) {}

  } else {
    // Mode Edit: verifikasi baris
    var candidateRow = -1;
    if (targetRow && targetRow > bHeaderRowIndex + 1 && targetRow <= bValues.length) {
      candidateRow = targetRow;
    } else {
      for (var bi2 = bHeaderRowIndex + 1; bi2 < bValues.length; bi2++) {
        var rAcara = String(bValues[bi2][bColMap.acara] || "").trim().toLowerCase();
        var matchAcara = (oldAcara && rAcara === oldAcara.toLowerCase()) || (rAcara === newAcara.toLowerCase());
        if (matchAcara) {
          candidateRow = bi2 + 1;
          break;
        }
      }
    }

    if (candidateRow === -1) {
      return createJsonResponse(false, "Baris agenda tidak ditemukan pada Google Sheets.", 404);
    }

    actualSourceRow = candidateRow;
    var preserveNo = no || String(bahsuSheet.getRange(actualSourceRow, bColMap.no + 1).getValue() || "").trim();

    bahsuSheet.getRange(actualSourceRow, bColMap.no + 1).setValue(preserveNo);
    bahsuSheet.getRange(actualSourceRow, bColMap.acara + 1).setValue(newAcara);
    bahsuSheet.getRange(actualSourceRow, bColMap.tanggal + 1).setValue(newTanggal);
    bahsuSheet.getRange(actualSourceRow, bColMap.delegasi + 1).setValue(delegasi);
    bahsuSheet.getRange(actualSourceRow, bColMap.keterangan + 1).setValue(keterangan);
    SpreadsheetApp.flush();
  }

  // Panggil fungsi inti sinkronisasi ke tab PERKEMBANGAN
  var syncResult = sinkronAgendaKePerkembangan(ss, actualSourceRow, oldAcara, oldTanggal, {
    isDryRun: false,
    isFromWeb: true,
    selectedStudents: event.selectedStudents || [],
    showToast: false
  });

  var upperKet = (keterangan || "").toUpperCase();
  var derivedStatus = (upperKet.indexOf("IZIN") !== -1 || upperKet.indexOf("BATAL") !== -1)
    ? "IZIN"
    : ((upperKet.indexOf("BELUM") !== -1 || upperKet.indexOf("BELOM") !== -1) ? "BELUM_BERANGKAT" : "SUDAH_BERANGKAT");

  var successMsg = "Agenda berhasil disimpan ke 'DAFTAR PEMBERANGKATAN BAHSU' dan disinkronkan ke " +
    syncResult.syncedCount + " riwayat santri di tab 'PERKEMBANGAN'.";

  return createJsonResponse(true, successMsg, 200, {
    sourceSheet: "DAFTAR PEMBERANGKATAN BAHSU",
    sourceRow: actualSourceRow,
    targetSheet: "PERKEMBANGAN",
    targetColumn: "J (BAHTSU YANG DIDATANGI)",
    syncedCount: syncResult.syncedCount,
    syncedMembers: syncResult.syncedMembers,
    alreadySyncedMembers: syncResult.alreadySyncedMembers,
    unmatchedDelegates: syncResult.unmatchedDelegates,
    event: {
      no: no,
      acara: newAcara,
      tanggal: newTanggal,
      delegasi: delegasi.split(/\r?\n/).map(function(s) { return s.trim(); }).filter(Boolean),
      keterangan: keterangan,
      statusKeberangkatan: derivedStatus
    }
  });
}

/**
 * ==============================================================================
 * MODUL 3: INSTALLABLE TRIGGER ONEDIT (EDIT LANGSUNG DI GOOGLE SHEETS)
 * ==============================================================================
 * Dipasang sekali via fungsi pasangTrigger().
 * Menangani edit pada kolom B (Acara), C (Tanggal), atau D (Delegasi).
 * Mendukung tempel (paste) beberapa baris sekaligus (iterasi e.range).
 */
function handleOnEditBahsu(e) {
  if (!e || !e.range) return;

  var range = e.range;
  var sheet = range.getSheet();
  var sheetName = sheet.getName().trim().toUpperCase();

  // Hanya proses jika edit terjadi pada tab DAFTAR PEMBERANGKATAN BAHSU
  if (sheetName !== "DAFTAR PEMBERANGKATAN BAHSU" && sheet.getSheetId() !== GID_BAHSU) {
    return;
  }

  var startRow = range.getRow();
  var numRows = range.getNumRows();
  var startCol = range.getColumn();
  var numCols = range.getNumColumns();
  var endCol = startCol + numCols - 1;

  // Header tabel biasanya baris 2 (data mulai baris 3). Abaikan edit pada header atau baris 1-2.
  if (startRow < 3) {
    if (startRow + numRows - 1 < 3) return; // Seluruh rentang edit ada di header
    startRow = 3;
    numRows = (range.getRow() + range.getNumRows() - 1) - startRow + 1;
  }

  // Kolom B = 2, Kolom C = 3, Kolom D = 4. Periksa apakah edit menyentuh salah satu dari kolom ini.
  var touchesTargetCols = !(endCol < 2 || startCol > 4);
  if (!touchesTargetCols) return;

  var ss = sheet.getParent();
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    hasLock = lock.tryLock(30000);
  } catch (errLock) {
    hasLock = false;
  }

  if (!hasLock) {
    var lockErrMsg = "⚠️ Sistem sibuk: Gagal mengunci spreadsheet saat memproses sinkronisasi onEdit. Perubahan Anda belum tersinkron.";
    Logger.log(lockErrMsg);
    try { ss.toast(lockErrMsg, "WAKA III Sync", 6); } catch (eT1) {}
    return;
  }

  try {
    // Tangkap nilai lama bila edit sel tunggal pada kolom B atau C
    var oldAcara = null;
    var oldTanggal = null;
    if (numRows === 1 && numCols === 1 && e.oldValue) {
      if (startCol === 2) oldAcara = String(e.oldValue).trim();
      else if (startCol === 3) oldTanggal = String(e.oldValue).trim();
    }

    var totalSynced = 0;

    // Iterasi setiap baris yang terdampak (mendukung paste multi-baris)
    for (var r = startRow; r < startRow + numRows; r++) {
      var syncRes = sinkronAgendaKePerkembangan(ss, r, oldAcara, oldTanggal, {
        isDryRun: false,
        showToast: true
      });
      if (syncRes.success) {
        totalSynced += syncRes.syncedCount;
      }
    }

  } catch (err) {
    Logger.log("Error pada handleOnEditBahsu: " + err.message);
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (eRel) {}
    }
  }
}

/**
 * ==============================================================================
 * MODUL 4: PEMASANGAN TRIGGER ONEDIT (DAPAT DIJALANKAN SEKALI OLEH ADMIN)
 * ==============================================================================
 * Idempoten: Memeriksa trigger yang sudah ada terlebih dahulu.
 * Tidak akan membuat trigger ganda jika sudah terpasang.
 */
function pasangTrigger() {
  var ss = getTargetSpreadsheet();
  var existingTriggers = ScriptApp.getProjectTriggers();
  var triggerExists = false;

  for (var i = 0; i < existingTriggers.length; i++) {
    var trigger = existingTriggers[i];
    if (trigger.getHandlerFunction() === "handleOnEditBahsu") {
      triggerExists = true;
      break;
    }
  }

  if (triggerExists) {
    var msgExist = "Trigger onEdit 'handleOnEditBahsu' sudah terpasang dan aktif. Tidak ada trigger ganda yang dibuat.";
    Logger.log(msgExist);
    try { ss.toast(msgExist, "WAKA III Trigger", 5); } catch (eToast) {}
    return;
  }

  ScriptApp.newTrigger("handleOnEditBahsu")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  var msgSuccess = "✅ Trigger onEdit sinkronisasi Bahsu berhasil dipasang!";
  Logger.log(msgSuccess);
  try { ss.toast(msgSuccess, "WAKA III Trigger", 6); } catch (eToast2) {}
}

/**
 * ==============================================================================
 * MODUL 5: SINKRONISASI MANUAL SELURUH AGENDA (BATCH & DRY-RUN)
 * ==============================================================================
 * Parameter:
 * - modeTulis (boolean): default FALSE (Dry-Run: hanya mencatat, tidak menulis).
 *   Setel ke TRUE hanya setelah mencadangkan Kolom J sheet PERKEMBANGAN.
 */
function sinkronSemuaAgenda(modeTulis) {
  if (modeTulis === undefined) modeTulis = false;

  var ss = getTargetSpreadsheet();
  var bahsuSheet = getSheetByGidOrName(ss, GID_BAHSU, "DAFTAR PEMBERANGKATAN BAHSU");
  if (!bahsuSheet) {
    Logger.log("Tab 'DAFTAR PEMBERANGKATAN BAHSU' tidak ditemukan.");
    return;
  }
  var anggotaSheet = getSheetByGidOrName(ss, GID_ANGGOTA, "PERKEMBANGAN");
  if (!anggotaSheet) {
    Logger.log("Tab 'PERKEMBANGAN' tidak ditemukan.");
    return;
  }

  // Petakan Kolom J (Bahtsu yang Didatangi) pada tab PERKEMBANGAN
  var aValues = anggotaSheet.getDataRange().getValues();
  var aColBahtsu = 9; // Kolom J default
  for (var ar = 0; ar < Math.min(5, aValues.length); ar++) {
    for (var ac = 0; ac < aValues[ar].length; ac++) {
      var hCell = String(aValues[ar][ac] || "").toUpperCase();
      if (hCell.indexOf("BAHTSU") !== -1 || hCell.indexOf("DIDATANGI") !== -1) {
        aColBahtsu = ac;
        break;
      }
    }
  }

  // 1. PEMBERSIHAN DATA UJI COBA & VERIFIKASI (Bila mode tulis aktif)
  if (modeTulis) {
    Logger.log("--- MEMBERSIHKAN DATA UJI COBA & VERIFIKASI ---");

    // (a) Bersihkan dari tab PERKEMBANGAN (Kolom J)
    for (var ai = 1; ai < aValues.length; ai++) {
      var curJ = String(aValues[ai][aColBahtsu] || "");
      if (curJ.indexOf("Uji Coba") !== -1 || curJ.indexOf("Verifikasi Otomatis") !== -1 || curJ.indexOf("Uji Dua Siswa") !== -1) {
        var linesJ = curJ.split(/\r?\n/);
        var cleanLinesJ = linesJ.filter(function(line) {
          var lLow = line.toLowerCase();
          return lLow.indexOf("uji coba") === -1 && lLow.indexOf("verifikasi otomatis") === -1 && lLow.indexOf("uji dua siswa") === -1;
        });
        anggotaSheet.getRange(ai + 1, aColBahtsu + 1).setValue(cleanLinesJ.join("\n"));
        Logger.log("  - Membersihkan entri uji dari santri baris " + (ai + 1));
      }
    }

    // (b) Hapus baris uji coba dari tab DAFTAR PEMBERANGKATAN BAHSU
    var bValsTemp = bahsuSheet.getDataRange().getValues();
    for (var bi = bValsTemp.length - 1; bi >= 2; bi--) {
      var checkRowAcara = String(bValsTemp[bi][1] || "").trim(); // Kolom B
      if (checkRowAcara.indexOf("Uji Coba") !== -1 || checkRowAcara.indexOf("Verifikasi Otomatis") !== -1) {
        bahsuSheet.deleteRow(bi + 1);
        Logger.log("  - Menghapus baris uji coba dari DAFTAR PEMBERANGKATAN: " + checkRowAcara);
      }
    }
    SpreadsheetApp.flush();
  }

  var lastRow = bahsuSheet.getLastRow();
  var bValuesFresh = bahsuSheet.getDataRange().getValues();

  Logger.log("==================================================================");
  Logger.log("MEMULAI SINKRONISASI SELURUH AGENDA (Mode: " + (modeTulis ? "PENULISAN AKTIF" : "DRY-RUN / UJI COBA") + ")");
  Logger.log("Versi Mesin: " + SCRIPT_VERSION);
  Logger.log("Total baris diperiksa: " + (lastRow - 2));
  Logger.log("==================================================================");

  var totalWritten = 0;
  var totalAlreadyInSheet = 0;
  var totalSkipped = 0;
  var allNonSantri = {};

  for (var r = 3; r <= lastRow; r++) {
    // Lewati jika baris ini adalah baris lanjutan (Col B kosong), karena delegasinya sudah diserap oleh baris utama
    var rowBVal = String(bValuesFresh[r - 1][1] || "").trim();
    if (!rowBVal) {
      continue;
    }

    var syncRes = sinkronAgendaKePerkembangan(ss, r, null, null, {
      isDryRun: !modeTulis,
      showToast: false
    });

    if (syncRes.skipped) {
      totalSkipped++;
    } else if (syncRes.success) {
      totalWritten += syncRes.syncedCount;
      totalAlreadyInSheet += syncRes.alreadySyncedMembers.length;

      if (syncRes.nonSantriSkipped && syncRes.nonSantriSkipped.length > 0) {
        for (var ns = 0; ns < syncRes.nonSantriSkipped.length; ns++) {
          allNonSantri[syncRes.nonSantriSkipped[ns]] = true;
        }
      }
    }
  }

  var nonSantriNames = Object.keys(allNonSantri);
  if (nonSantriNames.length > 0) {
    Logger.log("\n[RINGKASAN DELEGASI NON-SANTRI/PEMBINA YANG DILEWATI OTOMATIS]:");
    Logger.log(nonSantriNames.join(", "));
  }

  Logger.log("\n==================================================================");
  Logger.log("HASIL AKHIR SINKRONISASI SELURUH AGENDA:");
  Logger.log("- Entri yang " + (modeTulis ? "berhasil ditulis" : "AKAN ditulis (dry-run)") + ": " + totalWritten);
  Logger.log("- Entri yang dilewati karena sudah ada di Kolom J: " + totalAlreadyInSheet);
  Logger.log("- Baris dilewati (header/kosong/non-santri): " + totalSkipped);
  Logger.log("==================================================================");

  if (!modeTulis) {
    Logger.log("Catatan: Ini adalah DRY-RUN. Tidak ada data yang diubah di Google Sheets.");
    Logger.log("Untuk menerapkan perubahan ini ke Kolom J, jalankan: jalankanSinkronNyata() atau bersihkanDanSinkronUlang().");
  }
}

/**
 * ==============================================================================
 * FUNGSI PEMBANTU (HELPERS)
 * ==============================================================================
 */

/**
 * Buka spreadsheet target secara andal
 */
function getTargetSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getId() !== SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (e) {
    ss = null;
  }
  if (!ss) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return ss;
}

/**
 * Normalisasi nama secara ketat:
 * Menghapus nomor urut (1., 2), 3.M., 3a.), gelar (Bpk., Ust., Gus), tanda baca, dan spasi berlebih
 */
function cleanNameStrict(str) {
  if (!str) return "";
  return String(str)
    .replace(/^(\d+[\.\)]|\-|\•)\s*/, "")
    .replace(/^(\d+[\.\)]\s*m\.)/i, "m. ")
    .replace(/^(bpk\.|bapak|ust\.|ustadz|gus)\s+/i, "")
    .replace(/[''’`]/g, "")
    .replace(/[\.\,\;\:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Menghubungkan variasi ejaan umum santri ke nama resmi di spreadsheet
 */
function resolveStudentAlias(cleanName) {
  if (cleanName === "moh sabiqun nasich" || cleanName === "sabiqun nasich") {
    return "m sabiqun nasih";
  }
  if (cleanName === "abdul hakim ibnu asyharii") {
    return "abdul hakim ibnu asyhari";
  }
  if (cleanName === "azza aulia") {
    return "m aulia azza muzaka";
  }
  if (cleanName === "qolbun lam yanam") {
    return "moh qolbu lamyanam asshufi";
  }
  return cleanName;
}

/**
 * Deteksi apakah baris delegasi harus dilewati tanpa peringatan
 * (Bpk./Bapak, '-', 'KOM A', 'KOM B', 'KOMISI ...', 'Semua Anggota LBM', 'izin', 'batal')
 */
function shouldSkipDelegasiLine(line) {
  if (!line || !line.trim()) return true;
  var raw = line.trim().toLowerCase();
  var stripped = raw.replace(/^(\d+[\.\)]|\-|\•)\s*/, "").trim();

  if (stripped.indexOf("bpk.") === 0 || stripped.indexOf("bapak") === 0) return true;
  if (raw === "-" || stripped === "-" || stripped.indexOf("komisi") === 0 || stripped.indexOf("kom ") === 0 || stripped === "kom a" || stripped === "kom b") return true;
  if (raw.indexOf("semua anggota") !== -1 || stripped.indexOf("semua anggota") !== -1) return true;
  if (stripped === "izin" || stripped === "batal" || stripped === "nihil" || stripped === "tidak ada") return true;

  return false;
}

/**
 * Cek apakah nama merupakan delegasi non-santri yang sudah dikenal
 */
function isKnownNonSantri(rawLine) {
  var clean = cleanNameStrict(rawLine);
  var known = [
    "noval athoilah muhammad",
    "fahim maruf munafian",
    "m fikri al khoir",
    "zaid lugman muzagy"
  ];
  return known.some(function(k) { return clean.indexOf(k) !== -1 || k.indexOf(clean) !== -1; });
}

/**
 * Mencari kandidat terdekat hanya bila tingkat kemiripannya sangat tinggi
 */
function findClosestCandidate(cleanName, profiles) {
  for (var i = 0; i < profiles.length; i++) {
    var pClean = profiles[i].cleanNama;
    // Cek kemiripan tinggi: nama satu memuat nama lainnya dan panjangnya signifikan
    if (cleanName.length >= 8 && pClean.length >= 8) {
      if (cleanName.indexOf(pClean) !== -1 || pClean.indexOf(cleanName) !== -1) {
        return profiles[i].id + " (" + profiles[i].nama + ")";
      }
    }
  }
  return null;
}

/**
 * Normalisasi entri untuk perbandingan anti-duplikasi
 */
function cleanEntryForCompare(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\t\s]+/g, " ")
    .replace(/[''’`]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Ambil Sheet berdasarkan GID atau Nama (Case-Insensitive)
 */
function getSheetByGidOrName(ss, gid, fallbackName) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === Number(gid)) {
      return sheets[i];
    }
  }
  if (fallbackName) {
    var fnUpper = fallbackName.toUpperCase();
    for (var j = 0; j < sheets.length; j++) {
      if (sheets[j].getName().trim().toUpperCase() === fnUpper) {
        return sheets[j];
      }
    }
  }
  return null;
}

/**
 * Format Angka dengan Nol di Depan
 */
function padZero(num, size) {
  var s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

/**
 * Buat Response JSON Standar
 */
function createJsonResponse(success, message, statusCode, data) {
  var response = {
    success: success,
    version: SCRIPT_VERSION,
    message: message,
    statusCode: statusCode || (success ? 200 : 400),
    data: data || null
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
