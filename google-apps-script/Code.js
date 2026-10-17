/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT — SINKRONISASI BIODATA ANGGOTA LBM WAKA III
 * ==============================================================================
 * File: Code.js
 * Spreadsheet ID: 1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS (statistik new 2.xlsx)
 * Tab Anggota: PERKEMBANGAN (gid: 211010401)
 * Tab Pemberangkatan: DAFTAR PEMBERANGKATAN BAHSU (gid: 1165916830)
 *
 * FITUR KEAMANAN & INTEGRITAS DATA:
 * 1. LockService: Mencegah race-condition benturan penulisan bersamaan.
 * 2. Token Server-to-Server Wajib: Token disimpan pada Script Properties dengan nama
 *    SHEETS_API_SECRET_TOKEN. Tidak ada token fallback/hardcoded di dalam kode.
 * 3. Identitas Anggota Stabil (ID_ANGGOTA): Pencarian baris berbasis ID unik.
 * 4. Deteksi Duplikat & Data Ambigu: Menolak pembaruan jika ditemukan ID ganda.
 * 5. Whitelist Kolom: Hanya kolom biodata yang diizinkan yang dapat diedit.
 * 6. Preservasi Data: Tanggal, acara, keterangan, dan riwayat bahtsu tidak tersentuh.
 * 7. Penggantian Nama Delegasi Aman: Pencocokan baris demi baris secara tepat untuk
 *    menghindari penggantian nama santri lain akibat substring parsial.
 */

// Konfigurasi Default
var SPREADSHEET_ID = "1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS";
var GID_ANGGOTA = 211010401;
var GID_BAHSU = 1165916830;

/**
 * Handle GET Request (Healthcheck / Status)
 * Tidak mengekspos token, kredensial, maupun data sensitif apapun.
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
 * Handle POST Request (Update Biodata Anggota)
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
      // Tolak permintaan pengubahan data secara default jika token belum disetel di Script Properties
      return createJsonResponse(false, "Konfigurasi keamanan server belum lengkap: Script Property 'SHEETS_API_SECRET_TOKEN' belum disetel pada Project Settings Google Apps Script.", 500);
    }

    // Google Apps Script Web App menerima token yang dikirim melalui body JSON
    var providedToken = payload.token || (e.parameter && e.parameter.token);
    
    // Periksa token secara ketat tanpa mencetak nilainya ke pesan kesalahan atau log
    if (!providedToken || typeof providedToken !== "string" || providedToken !== configuredToken) {
      return createJsonResponse(false, "Otorisasi ditolak: Token autentikasi tidak valid atau tidak disertakan.", 401);
    }

    // 4. Validasi Parameter ID dan Perubahan
    var targetId = payload.id;
    var changes = payload.changes;

    if (!targetId || typeof targetId !== "string" || targetId.trim().length === 0) {
      return createJsonResponse(false, "Parameter 'id' anggota unik wajib disertakan.", 400);
    }
    targetId = targetId.trim().toUpperCase();

    // Validasi format ID anggota (alfanumerik, tanda hubung, atau garis bawah)
    if (!/^[A-Z0-9_\-]+$/.test(targetId)) {
      return createJsonResponse(false, "Format ID anggota tidak valid.", 400);
    }

    if (!changes || typeof changes !== "object" || Object.keys(changes).length === 0) {
      return createJsonResponse(false, "Objek 'changes' berisi data yang akan diubah wajib disertakan.", 400);
    }

    // 5. Buka Spreadsheet & Tab Anggota (PERKEMBANGAN)
    var ss;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      ss = null;
    }
    if (!ss) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }

    var anggotaSheet = getSheetByGidOrName(ss, GID_ANGGOTA, "PERKEMBANGAN");
    if (!anggotaSheet) {
      return createJsonResponse(false, "Tab data anggota LBM (PERKEMBANGAN) tidak ditemukan di spreadsheet.", 500);
    }

    // 6. Petakan Header Kolom & Pastikan Integritas Kolom ID_ANGGOTA
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
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || "").trim().toUpperCase();
      if (h === "NO." || h === "NO" || h.indexOf("NO.") !== -1) colMap.no = c;
      else if (h === "NAMA" || h.indexOf("NAMA") !== -1) colMap.nama = c;
      else if (h.indexOf("KELAS") !== -1) colMap.kelas = c;
      else if (h === "ID" || h === "ID_ANGGOTA" || h === "ID ANGGOTA" || h === "KODE") colMap.id = c;
      else if (h.indexOf("PERKEMBANGAN") !== -1 || h.indexOf("STATUS") !== -1) colMap.perkembangan = c;
      else if (h.indexOf("TTL") !== -1 || h.indexOf("LAHIR") !== -1) colMap.ttl = c;
      else if (h.indexOf("ALAMAT") !== -1) colMap.alamat = c;
      else if (h.indexOf("DOMISILI") !== -1) colMap.domisili = c;
      else if (h.indexOf("AYAH") !== -1 || h.indexOf("IBU") !== -1) colMap.ayahIbu = c;
      else if (h.indexOf("BAHTSU") !== -1 || h.indexOf("DIDATANGI") !== -1) colMap.bahtsu = c;
    }

    // Jika kolom ID belum memiliki header di baris header:
    // Periksa apakah Kolom D (index 3) benar-benar kosong sehingga aman dijadikan ID_ANGGOTA tanpa menimpa data
    if (colMap.id === undefined) {
      var targetColIdx = 3; // Kolom D (0-indexed 3)
      if (headers.length > targetColIdx && String(headers[targetColIdx] || "").trim() === "") {
        anggotaSheet.getRange(headerRowIndex + 1, targetColIdx + 1).setValue("ID_ANGGOTA");
        colMap.id = targetColIdx;
        headers[targetColIdx] = "ID_ANGGOTA";
      } else {
        // Tambahkan kolom ID_ANGGOTA di ujung akhir baris tabel agar tidak menggeser/menimpa kolom biodata
        var newCol = headers.length + 1;
        anggotaSheet.getRange(headerRowIndex + 1, newCol).setValue("ID_ANGGOTA");
        colMap.id = headers.length;
      }
    }

    // 7. Cari Baris Anggota Berdasarkan ID_ANGGOTA dengan Deteksi Duplikat Ketat
    var matchedRowIndices = [];
    var lastRow = values.length;

    // Kumpulkan seluruh ID yang sudah ada untuk memeriksa duplikasi
    var existingIdsCount = {};
    for (var i = headerRowIndex + 1; i < lastRow; i++) {
      var rowData = values[i];
      var rawNama = colMap.nama !== undefined ? String(rowData[colMap.nama] || "").trim() : "";
      if (!rawNama || rawNama.toLowerCase() === "nama" || rawNama.indexOf("---") === 0) continue;

      var rowId = colMap.id !== undefined ? String(rowData[colMap.id] || "").trim().toUpperCase() : "";
      var rawNo = colMap.no !== undefined ? String(rowData[colMap.no] || "").trim() : "";

      // Jika sel ID di baris ini masih kosong, periksa apakah cocok dengan format deterministik LBM-XXX
      if (!rowId && rawNo && !isNaN(parseInt(rawNo))) {
        var generatedId = "LBM-" + padZero(parseInt(rawNo), 3);
        if (generatedId === targetId) {
          rowId = generatedId;
          // Tuliskan ID permanen ke spreadsheet agar selalu terindeks stabil ke depannya
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

    // Validasi Integritas: Tolak jika ID tidak ditemukan, duplikat, atau target ambigu
    if (matchedRowIndices.length === 0) {
      return createJsonResponse(false, "Anggota dengan ID '" + targetId + "' tidak ditemukan pada tab anggota.", 404);
    }
    if (matchedRowIndices.length > 1 || (existingIdsCount[targetId] && existingIdsCount[targetId] > 1)) {
      var count = matchedRowIndices.length || existingIdsCount[targetId];
      return createJsonResponse(false, "Integritas data terganggu: Ditemukan " + count + " baris dengan ID '" + targetId + "'. Pembaruan dibatalkan.", 409);
    }

    var targetRowIndex = matchedRowIndices[0]; // 0-indexed row
    var currentRowValues = values[targetRowIndex];
    var oldNama = colMap.nama !== undefined ? String(currentRowValues[colMap.nama] || "").trim() : "";

    // 8. Terapkan Pembaruan Hanya pada Kolom yang Diizinkan (Whitelist)
    var allowedFields = ["nama", "kelas", "perkembangan", "ttl", "alamat", "domisili", "ayahIbu"];
    var updatedFields = [];

    for (var f = 0; f < allowedFields.length; f++) {
      var field = allowedFields[f];
      if (changes.hasOwnProperty(field) && changes[field] !== undefined && changes[field] !== null) {
        var colIndex = colMap[field];
        if (colIndex !== undefined) {
          var newVal = String(changes[field]).trim();
          // Validasi panjang string input
          if (newVal.length > 500) {
            newVal = newVal.substring(0, 500);
          }
          // Tulis ke sel Google Sheets (1-indexed)
          anggotaSheet.getRange(targetRowIndex + 1, colIndex + 1).setValue(newVal);
          updatedFields.push(field);
        }
      }
    }

    if (updatedFields.length === 0) {
      return createJsonResponse(false, "Tidak ada kolom yang diubah atau kolom tidak diizinkan untuk diedit.", 400);
    }

    // 9. Sinkronisasi Delegasi pada Tab DAFTAR PEMBERANGKATAN BAHSU jika Nama Berubah
    // Menggunakan pencocokan baris demi baris secara tepat untuk mencegah penggantian nama orang lain akibat kecocokan sebagian teks
    var newNama = changes.nama ? String(changes.nama).trim() : null;
    var bahsuUpdatedCount = 0;

    if (newNama && oldNama && newNama !== oldNama) {
      try {
        var bahsuSheet = getSheetByGidOrName(ss, GID_BAHSU, "DAFTAR PEMBERANGKATAN BAHSU");
        if (bahsuSheet) {
          var bahsuRange = bahsuSheet.getDataRange();
          var bahsuValues = bahsuRange.getValues();
          
          // Cari kolom Delegasi (biasanya kolom D / index 3)
          var delegasiColIdx = 3;
          for (var bc = 0; bc < (bahsuValues[1] ? bahsuValues[1].length : 0); bc++) {
            var bh = String(bahsuValues[1][bc] || "").trim().toUpperCase();
            if (bh.indexOf("DELEGASI") !== -1) {
              delegasiColIdx = bc;
              break;
            }
          }

          for (var bi = 2; bi < bahsuValues.length; bi++) {
            var rawDelegasi = String(bahsuValues[bi][delegasiColIdx] || "");
            if (rawDelegasi) {
              var replaceResult = replaceDelegasiNameSafe(rawDelegasi, oldNama, newNama);
              if (replaceResult.changed) {
                bahsuSheet.getRange(bi + 1, delegasiColIdx + 1).setValue(replaceResult.text);
                bahsuUpdatedCount++;
              }
            }
          }
        }
      } catch (bahsuErr) {
        // Tangani kendala non-fatal pada tab bahsu tanpa membatalkan pembaruan tab anggota
      }
    }

    // Flush seluruh pembaruan ke spreadsheet seketika
    SpreadsheetApp.flush();

    return createJsonResponse(true, "Biodata anggota '" + (newNama || oldNama) + "' (" + targetId + ") berhasil disimpan ke Google Sheets.", 200, {
      id: targetId,
      updatedFields: updatedFields,
      bahsuUpdatedCount: bahsuUpdatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse(false, "Terjadi kesalahan sistem saat menyimpan data: " + err.message, 500);
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (e) {}
    }
  }
}

/**
 * Helper: Mengganti nama delegasi pada teks baris demi baris secara tepat
 * Mencegah nama orang lain (misal 'Muhammad Thohir') terpotong jika nama yang diedit adalah 'Thohir'
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

    // Pisahkan awalan nomor urut / bullet / tanda hubung (contoh: "1. ", "2. ", "- ")
    var matchPrefix = line.match(/^(\s*(\d+[\.\)]|\-|\•)?\s*)(.*)$/);
    var prefix = matchPrefix ? matchPrefix[1] : "";
    var nameContent = matchPrefix ? matchPrefix[3] : line;

    // Normalisasi teks nama delegasi untuk dibandingkan dengan oldName
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
 * Helper: Normalisasi nama untuk perbandingan yang andal
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
 * Helper: Ambil Sheet berdasarkan GID atau Nama (Case-Insensitive)
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
 * Helper: Format Angka dengan Nol di Depan
 */
function padZero(num, size) {
  var s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

/**
 * Helper: Buat Response JSON Standar
 * Menghindari kebocoran token atau data rahasia
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
