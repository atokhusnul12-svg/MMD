/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT — SINKRONISASI DATA WEBSITE WAKA III & GOOGLE SHEETS
 * ==============================================================================
 * File: Code.js
 * Spreadsheet ID: 1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS (statistik new 2)
 * Tab Anggota: PERKEMBANGAN (gid: 211010401)
 * Tab Pemberangkatan: DAFTAR PEMBERANGKATAN BAHSU (gid: 1165916830)
 *
 * FITUR UTAMA:
 * 1. Sinkronisasi Dua Arah Kegiatan Bahtsul Masail:
 *    - Menyimpan/mengedit kegiatan pada tab DAFTAR PEMBERANGKATAN BAHSU.
 *    - Otomatis memperbarui kolom BAHTSU YANG DIDATANGI pada tab PERKEMBANGAN
 *      untuk setiap anggota santri yang tercatat menghadiri kegiatan tersebut.
 * 2. Pembaruan Biodata Anggota:
 *    - Menyimpan perubahan biodata anggota ke baris yang sesuai di tab PERKEMBANGAN.
 *    - Menyinkronkan perubahan nama ke tab DAFTAR PEMBERANGKATAN BAHSU secara aman.
 * 3. Keamanan & Integritas Data:
 *    - LockService 30 detik untuk mencegah race conditions.
 *    - Token Server-to-Server wajib dari Script Properties (SHEETS_API_SECRET_TOKEN).
 *    - Whitelist kolom, preservasi baris & rumus lain, pencegahan duplikasi data.
 */

// Konfigurasi Default
var SPREADSHEET_ID = "1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS";
var GID_ANGGOTA = 211010401;
var GID_BAHSU = 1165916830;

/**
 * Handle GET Request (Healthcheck / Status)
 */
function doGet(e) {
  var isTokenConfigured = false;
  try {
    var token = PropertiesService.getScriptProperties().getProperty("SHEETS_API_SECRET_TOKEN");
    isTokenConfigured = Boolean(token && token.trim().length > 0);
  } catch (err) {
    isTokenConfigured = false;
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "online",
      service: "WAKA III Google Sheets Sync API",
      configured: isTokenConfigured,
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST Request (Router Aksi)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  
  // 1. Kunci lembar kerja hingga 30 detik untuk menghindari benturan concurrent write
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
    // 2. Parsing payload JSON
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse(false, "Body permintaan kosong atau tidak valid.", 400);
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse(false, "Format JSON tidak valid: " + parseErr.message, 400);
    }

    // 3. Verifikasi Token Keamanan (Wajib dari Script Properties)
    var configuredToken = PropertiesService.getScriptProperties().getProperty("SHEETS_API_SECRET_TOKEN");
    if (!configuredToken || typeof configuredToken !== "string" || configuredToken.trim().length === 0) {
      return createJsonResponse(false, "Konfigurasi keamanan server belum lengkap: Script Property 'SHEETS_API_SECRET_TOKEN' belum disetel pada Project Settings Google Apps Script.", 500);
    }

    var providedToken = payload.token || (e.parameter && e.parameter.token);
    if (!providedToken || typeof providedToken !== "string" || providedToken !== configuredToken) {
      return createJsonResponse(false, "Otorisasi ditolak: Token autentikasi tidak valid atau tidak disertakan.", 401);
    }

    // 4. Buka Spreadsheet
    var ss;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      ss = null;
    }
    if (!ss) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }

    // 5. Dispatch Berdasarkan Action
    var action = payload.action;
    if (action === "syncBahsuEvent" || payload.event) {
      return handleSyncBahsuEvent(ss, payload);
    }

    // Penolakan Pembaruan Biodata Santri (Sesuai Kebijakan Data Bersifat Read-Only)
    return createJsonResponse(false, "Fitur pengeditan biodata santri dinonaktifkan. Data biodata santri pada tab PERKEMBANGAN bersifat tetap (read-only) dan tidak dapat diubah melalui API.", 403);

  } catch (err) {
    return createJsonResponse(false, "Terjadi kesalahan sistem saat memproses permintaan: " + err.message, 500);
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (e) {}
    }
  }
}

/**
 * ==============================================================================
 * MODUL 1: SINKRONISASI KEGIATAN BAHTSUL MASAIL KE KEDUA SHEET
 * ==============================================================================
 * Sheet Sumber: DAFTAR PEMBERANGKATAN BAHSU
 * Sheet Tujuan: PERKEMBANGAN (Kolom: BAHTSU YANG DIDATANGI)
 */
function handleSyncBahsuEvent(ss, payload) {
  var event = payload.event || {};
  var mode = event.mode || "edit"; // "edit" | "create"
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

  // 1. Buka Sheet Sumber (DAFTAR PEMBERANGKATAN BAHSU)
  var bahsuSheet = getSheetByGidOrName(ss, GID_BAHSU, "DAFTAR PEMBERANGKATAN BAHSU");
  if (!bahsuSheet) {
    return createJsonResponse(false, "Tab 'DAFTAR PEMBERANGKATAN BAHSU' tidak ditemukan di spreadsheet.", 500);
  }

  // 2. Temukan Header di DAFTAR PEMBERANGKATAN BAHSU
  var bahsuValues = bahsuSheet.getDataRange().getValues();
  var bHeaderRowIndex = -1;
  var bColMap = { no: 0, acara: 1, tanggal: 2, delegasi: 3, keterangan: 4 };

  for (var r = 0; r < Math.min(10, bahsuValues.length); r++) {
    var bRow = bahsuValues[r];
    for (var c = 0; c < bRow.length; c++) {
      var cellText = String(bRow[c] || "").trim().toUpperCase();
      if (cellText === "BAHTSUL MASAIL" || cellText.indexOf("BAHTSUL MASAIL") !== -1) {
        bHeaderRowIndex = r;
        break;
      }
    }
    if (bHeaderRowIndex !== -1) break;
  }

  if (bHeaderRowIndex !== -1) {
    var bHeaders = bahsuValues[bHeaderRowIndex];
    for (var bc = 0; bc < bHeaders.length; bc++) {
      var bh = String(bHeaders[bc] || "").trim().toUpperCase();
      if (bh === "NO." || bh === "NO") bColMap.no = bc;
      else if (bh.indexOf("BAHTSUL") !== -1 || bh.indexOf("MASAIL") !== -1 || bh.indexOf("ACARA") !== -1) bColMap.acara = bc;
      else if (bh.indexOf("TANGGAL") !== -1) bColMap.tanggal = bc;
      else if (bh.indexOf("DELEGASI") !== -1) bColMap.delegasi = bc;
      else if (bh.indexOf("KETERANGAN") !== -1 || bh.indexOf("STATUS") !== -1) bColMap.keterangan = bc;
    }
  } else {
    bHeaderRowIndex = 1; // Default baris 2
  }

  var actualSourceRow = -1;

  if (mode === "create") {
    // Mode Tambah Kegiatan Baru
    if (!no) {
      // Hitung urutan nomor agenda otomatis berdasarkan angka terbesar yang sudah ada
      var maxNo = 0;
      for (var bi = bHeaderRowIndex + 1; bi < bahsuValues.length; bi++) {
        var rawVal = String(bahsuValues[bi][bColMap.no] || "").trim();
        var parsedNo = parseInt(rawVal, 10);
        if (!isNaN(parsedNo) && parsedNo > maxNo) {
          maxNo = parsedNo;
        }
      }
      no = String(maxNo > 0 ? maxNo + 1 : bahsuValues.length);
    }

    // Cegah duplikasi penulisan jika formulir terkirim ulang secara cepat
    var alreadyExistsRow = -1;
    for (var biCheck = bahsuValues.length - 1; biCheck >= Math.max(0, bahsuValues.length - 15); biCheck--) {
      var rowA = String(bahsuValues[biCheck][bColMap.acara] || "").trim().toLowerCase();
      var rowT = String(bahsuValues[biCheck][bColMap.tanggal] || "").trim().toLowerCase();
      if (rowA === newAcara.toLowerCase() && (!newTanggal || rowT === newTanggal.toLowerCase())) {
        alreadyExistsRow = biCheck + 1;
        break;
      }
    }

    if (alreadyExistsRow !== -1) {
      actualSourceRow = alreadyExistsRow;
      if (no) bahsuSheet.getRange(actualSourceRow, bColMap.no + 1).setValue(no);
      bahsuSheet.getRange(actualSourceRow, bColMap.acara + 1).setValue(newAcara);
      bahsuSheet.getRange(actualSourceRow, bColMap.tanggal + 1).setValue(newTanggal);
      bahsuSheet.getRange(actualSourceRow, bColMap.delegasi + 1).setValue(delegasi);
      bahsuSheet.getRange(actualSourceRow, bColMap.keterangan + 1).setValue(keterangan);
    } else {
      var nextRow = bahsuSheet.getLastRow() + 1;
      actualSourceRow = nextRow;
      bahsuSheet.getRange(actualSourceRow, bColMap.no + 1).setValue(no);
      bahsuSheet.getRange(actualSourceRow, bColMap.acara + 1).setValue(newAcara);
      bahsuSheet.getRange(actualSourceRow, bColMap.tanggal + 1).setValue(newTanggal);
      bahsuSheet.getRange(actualSourceRow, bColMap.delegasi + 1).setValue(delegasi);
      bahsuSheet.getRange(actualSourceRow, bColMap.keterangan + 1).setValue(keterangan);
    }

    try {
      bahsuSheet.getRange(actualSourceRow, 1, 1, 5).setWrap(true);
    } catch (eWrap) {}

  } else {
    // Mode Edit Kegiatan yang Ada
    if (targetRow && targetRow > bHeaderRowIndex + 1 && targetRow <= bahsuValues.length) {
      actualSourceRow = targetRow;
    } else {
      // Cari baris berdasarkan kecocokan oldAcara atau no
      for (var bi2 = bHeaderRowIndex + 1; bi2 < bahsuValues.length; bi2++) {
        var rowAcara = String(bahsuValues[bi2][bColMap.acara] || "").trim();
        var rowNo = String(bahsuValues[bi2][bColMap.no] || "").trim();
        if ((oldAcara && rowAcara.toLowerCase() === oldAcara.toLowerCase()) || (no && rowNo === no)) {
          actualSourceRow = bi2 + 1;
          break;
        }
      }
    }

    if (actualSourceRow === -1) {
      return createJsonResponse(false, "Baris kegiatan yang akan diedit tidak ditemukan di tab DAFTAR PEMBERANGKATAN BAHSU.", 404);
    }

    if (no) bahsuSheet.getRange(actualSourceRow, bColMap.no + 1).setValue(no);
    bahsuSheet.getRange(actualSourceRow, bColMap.acara + 1).setValue(newAcara);
    bahsuSheet.getRange(actualSourceRow, bColMap.tanggal + 1).setValue(newTanggal);
    bahsuSheet.getRange(actualSourceRow, bColMap.delegasi + 1).setValue(delegasi);
    bahsuSheet.getRange(actualSourceRow, bColMap.keterangan + 1).setValue(keterangan);

    try {
      bahsuSheet.getRange(actualSourceRow, 1, 1, 5).setWrap(true);
    } catch (eWrap2) {}
  }

  // 3. SINKRONISASI KE TAB PERKEMBANGAN (KOLOM BAHTSU YANG DIDATANGI)
  var anggotaSheet = getSheetByGidOrName(ss, GID_ANGGOTA, "PERKEMBANGAN");
  if (!anggotaSheet) {
    return createJsonResponse(true, "Kegiatan tersimpan di DAFTAR PEMBERANGKATAN BAHSU, namun tab PERKEMBANGAN tidak ditemukan untuk sinkronisasi.", 200, {
      sourceSheetUpdated: true,
      sourceRow: actualSourceRow,
      targetSheetSynced: false
    });
  }

  var aValues = anggotaSheet.getDataRange().getValues();
  var aHeaderRowIndex = -1;
  var aColMap = { no: 0, nama: 1, id: 3, bahtsu: 9 };

  for (var ar = 0; ar < Math.min(10, aValues.length); ar++) {
    var aRow = aValues[ar];
    for (var ac = 0; ac < aRow.length; ac++) {
      var acCell = String(aRow[ac] || "").trim().toUpperCase();
      if (acCell === "NAMA" || acCell.indexOf("NAMA") !== -1) {
        aHeaderRowIndex = ar;
        break;
      }
    }
    if (aHeaderRowIndex !== -1) break;
  }

  if (aHeaderRowIndex !== -1) {
    var aHeaders = aValues[aHeaderRowIndex];
    for (var ahc = 0; ahc < aHeaders.length; ahc++) {
      var ah = String(aHeaders[ahc] || "").trim().toUpperCase();
      if (ah === "NO." || ah === "NO" || ah.indexOf("NO.") !== -1) aColMap.no = ahc;
      else if (ah === "NAMA" || ah.indexOf("NAMA") !== -1) aColMap.nama = ahc;
      else if (ah === "ID" || ah === "ID_ANGGOTA" || ah === "ID ANGGOTA") aColMap.id = ahc;
      else if (ah.indexOf("BAHTSU") !== -1 || ah.indexOf("DIDATANGI") !== -1) aColMap.bahtsu = ahc;
    }
  } else {
    aHeaderRowIndex = 0;
  }

  // Ekstrak baris-baris nama delegasi dari teks input
  var delegasiLines = delegasi.split(/\r?\n/).map(function(s) { return s.trim(); }).filter(Boolean);
  var attendingNamesClean = [];
  var matchedMemberIds = Array.isArray(event.matchedMemberIds) ? event.matchedMemberIds : [];

  for (var dl = 0; dl < delegasiLines.length; dl++) {
    var dLine = delegasiLines[dl];
    var cName = cleanNameForCompare(dLine);
    // Lewati baris komisi, izin, tanda strip, atau "semua anggota"
    if (!cName || cName.indexOf("komisi") === 0 || cName.indexOf("kom ") === 0 || cName === "-" || cName.indexOf("semua anggota") !== -1 || cName === "izin" || cName === "batal" || cName === "tidak ada" || cName === "nihil") {
      continue;
    }
    attendingNamesClean.push(cName);
  }

  var isIzinEvent = keterangan.toUpperCase().indexOf("IZIN") !== -1;
  var newEventLine = (newTanggal && newTanggal.trim()) 
    ? (newAcara.trim() + " " + newTanggal.trim()) 
    : newAcara.trim();

  var cleanOldAcara = oldAcara ? oldAcara.trim().toLowerCase() : "";
  var cleanNewAcara = newAcara ? newAcara.trim().toLowerCase() : "";

  var syncedMembers = [];
  var removedMembers = [];

  // Telusuri seluruh santri di tab PERKEMBANGAN
  for (var ai = aHeaderRowIndex + 1; ai < aValues.length; ai++) {
    var mRow = aValues[ai];
    var mNama = String(mRow[aColMap.nama] || "").trim();
    if (!mNama || mNama.toLowerCase() === "nama" || mNama.indexOf("---") === 0) continue;

    var mNamaClean = cleanNameForCompare(mNama);
    if (!mNamaClean) continue;

    // Periksa ID anggota jika ada
    var mRawNo = aColMap.no !== undefined ? String(mRow[aColMap.no] || "").trim() : "";
    var mId = aColMap.id !== undefined ? String(mRow[aColMap.id] || "").trim().toUpperCase() : "";
    if (!mId && mRawNo && !isNaN(parseInt(mRawNo, 10))) {
      mId = "LBM-" + padZero(parseInt(mRawNo, 10), 3);
    }

    // Cek apakah santri ini tercatat sebagai delegasi yang hadir
    var isAttending = false;

    // 1. Cek kecocokan via ID anggota stabil
    if (mId && matchedMemberIds.length > 0 && matchedMemberIds.indexOf(mId) !== -1) {
      isAttending = true;
    }

    // 2. Cek kecocokan via nama yang sudah dibersihkan
    if (!isAttending) {
      for (var att = 0; att < attendingNamesClean.length; att++) {
        var aTarget = attendingNamesClean[att];
        if (mNamaClean === aTarget) {
          isAttending = true;
          break;
        }
        // Substring matching hanya untuk nama panjang (minimal 6 karakter) guna menghindari salah cocok
        if (aTarget.length >= 6 && mNamaClean.length >= 6 && (mNamaClean.indexOf(aTarget) !== -1 || aTarget.indexOf(mNamaClean) !== -1)) {
          isAttending = true;
          break;
        }
      }
    }

    var currentBahtsuCell = String(mRow[aColMap.bahtsu] || "");
    var mLines = currentBahtsuCell.split(/\r?\n/).map(function(s) { return s.trim(); }).filter(Boolean);
    var lineModified = false;

    if (isAttending && !isIzinEvent) {
      // Santri HADIR: pastikan newEventLine ada di kolom BAHTSU YANG DIDATANGI
      var foundIdx = -1;
      for (var li = 0; li < mLines.length; li++) {
        var lineLower = mLines[li].toLowerCase();
        if (cleanOldAcara && lineLower.indexOf(cleanOldAcara) !== -1) {
          foundIdx = li;
          break;
        }
        if (cleanNewAcara && lineLower.indexOf(cleanNewAcara) !== -1) {
          foundIdx = li;
          break;
        }
      }

      if (foundIdx !== -1) {
        if (mLines[foundIdx] !== newEventLine) {
          mLines[foundIdx] = newEventLine;
          lineModified = true;
        }
      } else {
        mLines.push(newEventLine);
        lineModified = true;
      }

      if (lineModified) {
        syncedMembers.push(mNama);
      }

    } else {
      // Santri TIDAK HADIR atau Status IZIN: Jika sebelumnya pernah hadir pada kegiatan ini, hapus dari riwayat
      if ((mode === "edit" || isIzinEvent) && (cleanOldAcara || cleanNewAcara)) {
        var targetSearch = cleanOldAcara || cleanNewAcara;
        var filteredLines = [];
        for (var lk = 0; lk < mLines.length; lk++) {
          var curLower = mLines[lk].toLowerCase();
          if (curLower.indexOf(targetSearch) !== -1) {
            lineModified = true;
          } else {
            filteredLines.push(mLines[lk]);
          }
        }
        if (lineModified) {
          mLines = filteredLines;
          removedMembers.push(mNama);
        }
      }
    }

    // Tulis kembali ke sel jika terjadi perubahan
    if (lineModified) {
      var updatedBahtsuText = mLines.join("\n");
      anggotaSheet.getRange(ai + 1, aColMap.bahtsu + 1).setValue(updatedBahtsuText);
    }
  }

  SpreadsheetApp.flush();

  return createJsonResponse(true, "Data kegiatan berhasil disimpan ke 'DAFTAR PEMBERANGKATAN BAHSU' dan disinkronkan ke " + syncedMembers.length + " anggota di sheet 'PERKEMBANGAN'.", 200, {
    sourceSheet: "DAFTAR PEMBERANGKATAN BAHSU",
    sourceRow: actualSourceRow,
    targetSheet: "PERKEMBANGAN",
    syncedCount: syncedMembers.length,
    syncedMembers: syncedMembers,
    removedCount: removedMembers.length,
    removedMembers: removedMembers,
    event: {
      no: no,
      acara: newAcara,
      tanggal: newTanggal,
      delegasi: delegasiLines,
      keterangan: keterangan,
      statusKeberangkatan: isIzinEvent ? "IZIN" : (keterangan.toUpperCase().indexOf("BELUM") !== -1 ? "BELUM_BERANGKAT" : "SUDAH_BERANGKAT")
    }
  });
}

/**
 * ==============================================================================
 * MODUL 2: PEMBARUAN BIODATA ANGGOTA PADA TAB PERKEMBANGAN
 * ==============================================================================
 */
function handleUpdateBiodata(ss, payload) {
  var targetId = payload.id;
  var changes = payload.changes;

  if (!targetId || typeof targetId !== "string" || targetId.trim().length === 0) {
    return createJsonResponse(false, "Parameter 'id' anggota unik wajib disertakan.", 400);
  }
  targetId = targetId.trim().toUpperCase();

  if (!/^[A-Z0-9_\-]+$/.test(targetId)) {
    return createJsonResponse(false, "Format ID anggota tidak valid.", 400);
  }

  if (!changes || typeof changes !== "object" || Object.keys(changes).length === 0) {
    return createJsonResponse(false, "Objek 'changes' berisi data yang akan diubah wajib disertakan.", 400);
  }

  var anggotaSheet = getSheetByGidOrName(ss, GID_ANGGOTA, "PERKEMBANGAN");
  if (!anggotaSheet) {
    return createJsonResponse(false, "Tab data anggota LBM (PERKEMBANGAN) tidak ditemukan di spreadsheet.", 500);
  }

  var dataRange = anggotaSheet.getDataRange();
  var values = dataRange.getValues();
  if (values.length < 2) {
    return createJsonResponse(false, "Data spreadsheet anggota kosong.", 404);
  }

  var headerRowIndex = -1;
  var colMap = {};

  for (var r = 0; r < Math.min(10, values.length); r++) {
    var row = values[r];
    var hasNama = false;
    for (var c = 0; c < row.length; c++) {
      var cell = String(row[c] || "").trim().toUpperCase();
      if (cell === "NAMA" || cell.indexOf("NAMA") !== -1) {
        hasNama = true;
        break;
      }
    }
    if (hasNama) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return createJsonResponse(false, "Baris header kolom pada tab anggota tidak dapat diidentifikasi.", 500);
  }

  var headers = values[headerRowIndex];
  for (var c2 = 0; c2 < headers.length; c2++) {
    var h = String(headers[c2] || "").trim().toUpperCase();
    if (h === "NO." || h === "NO" || h.indexOf("NO.") !== -1) colMap.no = c2;
    else if (h === "NAMA" || h.indexOf("NAMA") !== -1) colMap.nama = c2;
    else if (h.indexOf("KELAS") !== -1) colMap.kelas = c2;
    else if (h === "ID" || h === "ID_ANGGOTA" || h === "ID ANGGOTA" || h === "KODE") colMap.id = c2;
    else if (h.indexOf("PERKEMBANGAN") !== -1 || h.indexOf("STATUS") !== -1) colMap.perkembangan = c2;
    else if (h.indexOf("TTL") !== -1 || h.indexOf("LAHIR") !== -1) colMap.ttl = c2;
    else if (h.indexOf("ALAMAT") !== -1) colMap.alamat = c2;
    else if (h.indexOf("DOMISILI") !== -1) colMap.domisili = c2;
    else if (h.indexOf("AYAH") !== -1 || h.indexOf("IBU") !== -1) colMap.ayahIbu = c2;
    else if (h.indexOf("BAHTSU") !== -1 || h.indexOf("DIDATANGI") !== -1) colMap.bahtsu = c2;
  }

  if (colMap.id === undefined) {
    var targetColIdx = 3; // Kolom D
    if (headers.length > targetColIdx && String(headers[targetColIdx] || "").trim() === "") {
      anggotaSheet.getRange(headerRowIndex + 1, targetColIdx + 1).setValue("ID_ANGGOTA");
      colMap.id = targetColIdx;
      headers[targetColIdx] = "ID_ANGGOTA";
    } else {
      var newCol = headers.length + 1;
      anggotaSheet.getRange(headerRowIndex + 1, newCol).setValue("ID_ANGGOTA");
      colMap.id = headers.length;
    }
  }

  var matchedRowIndices = [];
  var lastRow = values.length;
  var existingIdsCount = {};

  for (var i = headerRowIndex + 1; i < lastRow; i++) {
    var rowData = values[i];
    var rawNama = colMap.nama !== undefined ? String(rowData[colMap.nama] || "").trim() : "";
    if (!rawNama || rawNama.toLowerCase() === "nama" || rawNama.indexOf("---") === 0) continue;

    var rowId = colMap.id !== undefined ? String(rowData[colMap.id] || "").trim().toUpperCase() : "";
    var rawNo = colMap.no !== undefined ? String(rowData[colMap.no] || "").trim() : "";

    if (!rowId && rawNo && !isNaN(parseInt(rawNo))) {
      var generatedId = "LBM-" + padZero(parseInt(rawNo), 3);
      if (generatedId === targetId) {
        rowId = generatedId;
        anggotaSheet.getRange(i + 1, colMap.id + 1).setValue(rowId);
      }
    }

    if (rowId) {
      existingIdsCount[rowId] = (existingIdsCount[rowId] || 0) + 1;
    }

    if (rowId === targetId) {
      matchedRowIndices.push(i);
    }
  }

  if (matchedRowIndices.length === 0) {
    return createJsonResponse(false, "Anggota dengan ID '" + targetId + "' tidak ditemukan pada Google Sheets.", 404);
  }

  if (matchedRowIndices.length > 1) {
    return createJsonResponse(false, "Integritas data terancam: Ditemukan " + matchedRowIndices.length + " baris anggota dengan ID duplikat '" + targetId + "'. Silakan periksa spreadsheet secara manual.", 409);
  }

  var targetRowIndex = matchedRowIndices[0];
  var targetRowData = values[targetRowIndex];
  var oldNama = colMap.nama !== undefined ? String(targetRowData[colMap.nama] || "").trim() : "";

  var allowedFields = ["nama", "kelas", "perkembangan", "ttl", "alamat", "domisili", "ayahIbu"];
  var updatedFields = [];

  for (var f = 0; f < allowedFields.length; f++) {
    var field = allowedFields[f];
    if (changes.hasOwnProperty(field) && changes[field] !== undefined && changes[field] !== null) {
      var colIndex = colMap[field];
      if (colIndex !== undefined) {
        var newVal = String(changes[field]).trim();
        if (newVal.length > 500) {
          newVal = newVal.substring(0, 500);
        }
        anggotaSheet.getRange(targetRowIndex + 1, colIndex + 1).setValue(newVal);
        updatedFields.push(field);
      }
    }
  }

  if (updatedFields.length === 0) {
    return createJsonResponse(false, "Tidak ada kolom yang diubah atau kolom tidak diizinkan untuk diedit.", 400);
  }

  var newNama = changes.nama ? String(changes.nama).trim() : null;
  var bahsuUpdatedCount = 0;

  if (newNama && oldNama && newNama !== oldNama) {
    try {
      var bSheet = getSheetByGidOrName(ss, GID_BAHSU, "DAFTAR PEMBERANGKATAN BAHSU");
      if (bSheet) {
        var bRange = bSheet.getDataRange();
        var bVals = bRange.getValues();
        var delCol = 3;
        for (var bci = 0; bci < (bVals[1] ? bVals[1].length : 0); bci++) {
          var bHeader = String(bVals[1][bci] || "").trim().toUpperCase();
          if (bHeader.indexOf("DELEGASI") !== -1) {
            delCol = bci;
            break;
          }
        }

        for (var bi3 = 2; bi3 < bVals.length; bi3++) {
          var rDel = String(bVals[bi3][delCol] || "");
          if (rDel) {
            var repRes = replaceDelegasiNameSafe(rDel, oldNama, newNama);
            if (repRes.changed) {
              bSheet.getRange(bi3 + 1, delCol + 1).setValue(repRes.text);
              bahsuUpdatedCount++;
            }
          }
        }
      }
    } catch (bErr) {}
  }

  SpreadsheetApp.flush();

  return createJsonResponse(true, "Biodata anggota '" + (newNama || oldNama) + "' (" + targetId + ") berhasil disimpan ke Google Sheets.", 200, {
    id: targetId,
    updatedFields: updatedFields,
    bahsuUpdatedCount: bahsuUpdatedCount,
    timestamp: new Date().toISOString()
  });
}

/**
 * ==============================================================================
 * FUNGSI PEMBANTU (HELPERS)
 * ==============================================================================
 */

/**
 * Normalisasi nama untuk perbandingan yang andal
 */
function cleanNameForCompare(str) {
  if (!str) return "";
  return String(str)
    .replace(/^(\d+[\.\)]|\-|\•)\s*/, "")
    .replace(/^(bpk\.|bapak|ust\.|ustadz|gus)\s+/i, "")
    .replace(/[''’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Mengganti nama delegasi pada teks baris demi baris secara tepat
 */
function replaceDelegasiNameSafe(rawDelegasi, oldName, newName) {
  if (!rawDelegasi || typeof rawDelegasi !== "string") {
    return { changed: false, text: rawDelegasi };
  }

  var lines = rawDelegasi.split("\n");
  var changed = false;
  var cleanOld = cleanNameForCompare(oldName);

  var newLines = lines.map(function(line) {
    var trimmedLine = line.trim();
    if (!trimmedLine) return line;

    var matchPrefix = line.match(/^(\s*(\d+[\.\)]|\-|\•)?\s*)(.*)$/);
    var prefix = matchPrefix ? matchPrefix[1] : "";
    var nameContent = matchPrefix ? matchPrefix[3] : line;
    var cleanContent = cleanNameForCompare(nameContent);

    if (cleanContent === cleanOld) {
      changed = true;
      return prefix + newName;
    }

    return line;
  });

  return {
    changed: changed,
    text: newLines.join("\n")
  };
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
    message: message,
    statusCode: statusCode || (success ? 200 : 400),
    data: data || null
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
