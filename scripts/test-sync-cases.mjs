import assert from 'node:assert';
import { DATA_LINKS } from '../lib/dataLinks.js';
import { getAnggotaData, getBahsuData, fetchRawCSV } from '../lib/fetchCSV.js';
import Papa from 'papaparse';

console.log('================================================================');
console.log('🧪 PENGUJIAN LOGIKA SINKRONISASI AGENDA BAHSU KE KOLOM J');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function testAssert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// -------------------------------------------------------------
// TEST 1: Penjagaan Input Bertahap (Mengetik B, lalu C, lalu Delegasi)
// -------------------------------------------------------------
console.log('📌 Test 1: Guard Input Bertahap (Tidak menulis data setengah jadi)');
function simulateValidation(acara, tanggal, delegasi) {
  if (!acara || !tanggal || !delegasi) {
    return { shouldWrite: false, reason: 'Baris belum lengkap' };
  }
  return { shouldWrite: true };
}

testAssert(simulateValidation('LBM Badas', '', '').shouldWrite === false, 'Hanya kolom B terisi -> Tidak menulis');
testAssert(simulateValidation('LBM Badas', '20 Oktober 2026', '').shouldWrite === false, 'Kolom B & C terisi tapi delegasi kosong -> Tidak menulis');
testAssert(simulateValidation('', '20 Oktober 2026', 'Muhammad Thohir').shouldWrite === false, 'Kolom B kosong -> Tidak menulis');
testAssert(simulateValidation('LBM Badas', '20 Oktober 2026', 'Muhammad Thohir').shouldWrite === true, 'B, C, dan Delegasi terisi lengkap -> Siap menulis');

// -------------------------------------------------------------
// TEST 2: Dua Santri Bernama Mirip (Thohir vs Muthohir)
// -------------------------------------------------------------
console.log('\n📌 Test 2: Pemisahan Santri Bernama Mirip (Muhammad Thohir vs Muhammad Muthohir)');
const mockMembers = [
  { id: 'LBM-002', nama: 'Muhammad Thohir', cleanNama: 'muhammad thohir' },
  { id: 'LBM-011', nama: 'Muhammad Muthohir', cleanNama: 'muhammad muthohir' },
];

function matchStrict(nameInput, profiles) {
  const clean = nameInput.replace(/^(\d+[\.\)]|\-|\•)\s*/, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  for (const p of profiles) {
    if (p.cleanNama === clean) return p;
  }
  return null;
}

const match1 = matchStrict('1. Muhammad Thohir', mockMembers);
testAssert(match1 && match1.id === 'LBM-002', 'Input "1. Muhammad Thohir" tepat menjodohkan LBM-002');

const match2 = matchStrict('1. Muhammad Muthohir', mockMembers);
testAssert(match2 && match2.id === 'LBM-011', 'Input "1. Muhammad Muthohir" tepat menjodohkan LBM-011');

const matchMismatch = matchStrict('1. Muhammad Thohir', [mockMembers[1]]);
testAssert(matchMismatch === null, 'Input "Muhammad Thohir" TIDAK pernah menjodohkan Muhammad Muthohir (LBM-011)');

// -------------------------------------------------------------
// TEST 3: Aturan Penempatan di Baris Kosong Pertama Setelah Baris Terisi Terakhir
// -------------------------------------------------------------
console.log('\n📌 Test 3: Penempatan Baris Kosong Pertama Setelah Baris Terisi Terakhir');
function applyPlacementRule(currentCellVal, newEntry) {
  const lines = currentCellVal.split(/\r?\n/);
  let lastFilledIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().length > 0) {
      lastFilledIdx = i;
      break;
    }
  }

  if (lastFilledIdx === -1) {
    return [newEntry];
  } else if (lastFilledIdx + 1 < lines.length) {
    lines[lastFilledIdx + 1] = newEntry;
    return lines;
  } else {
    lines.push(newEntry);
    return lines;
  }
}

// Kasus A: Sel kosong
const resA = applyPlacementRule('', 'Agenda Baru\t01 Jan');
testAssert(resA.length === 1 && resA[0] === 'Agenda Baru\t01 Jan', 'Sel kosong terisi pada baris pertama');

// Kasus B: Sel dengan 5 baris kosong di bawah baris terisi
const cellWithTrailing = 'Agenda Lama 1\t01 Jan\n\n\n\n\n';
const resB = applyPlacementRule(cellWithTrailing, 'Agenda Baru 2\t02 Feb');
testAssert(resB[0] === 'Agenda Lama 1\t01 Jan', 'Baris lama tidak berubah');
testAssert(resB[1] === 'Agenda Baru 2\t02 Feb', 'Baris baru menempati baris kosong pertama tepat di bawahnya');
testAssert(resB.length === 6, 'Sisa baris kosong di bawahnya tetap terjaga tanpa terhapus');

// -------------------------------------------------------------
// TEST 4: Anti-Duplikasi (Idempoten)
// -------------------------------------------------------------
console.log('\n📌 Test 4: Anti-Duplikasi (Eksekusi berulang tidak menggandakan)');
function checkAlreadyExists(cellVal, acara, tanggal) {
  const lines = cellVal.split(/\r?\n/);
  const target = `${acara} ${tanggal}`.replace(/[\t\s]+/g, ' ').toLowerCase().trim();
  return lines.some(l => l.replace(/[\t\s]+/g, ' ').toLowerCase().trim() === target);
}

const cellTest = 'LBM MWC NU Badas\t13 April 2026 M.\nMWC Badas\t05 Oktober 2026 M.';
testAssert(checkAlreadyExists(cellTest, 'LBM MWC NU Badas', '13 April 2026 M.') === true, 'Mendeteksi agenda yang sudah ada');
testAssert(checkAlreadyExists(cellTest, 'LBM MWC NU Badas', '20 Oktober 2026 M.') === false, 'Membedakan agenda dengan tanggal berbeda');
testAssert(checkAlreadyExists(cellTest, 'Forum Baru Lain', '13 April 2026 M.') === false, 'Membedakan forum baru');

// -------------------------------------------------------------
// TEST 5: Penggantian Baris Lama Saat Edit Acara / Tanggal
// -------------------------------------------------------------
console.log('\n📌 Test 5: Penggantian Nilai Baris Saat Edit Acara / Tanggal');
function applyEditReplacement(cellVal, oldAcara, oldTanggal, newAcara, newTanggal) {
  const lines = cellVal.split(/\r?\n/);
  const oldTarget = `${oldAcara} ${oldTanggal}`.replace(/[\t\s]+/g, ' ').toLowerCase().trim();
  const newEntry = `${newAcara}\t${newTanggal}`;
  let replaced = false;

  for (let i = 0; i < lines.length; i++) {
    const lCompare = lines[i].replace(/[\t\s]+/g, ' ').toLowerCase().trim();
    if (lCompare === oldTarget) {
      lines[i] = newEntry;
      replaced = true;
      break;
    }
  }

  return { lines, replaced };
}

const editCellTest = 'Agenda A\t10 Jan\nAgenda B Lama\t15 Feb\nAgenda C\t20 Mar';
const editRes = applyEditReplacement(editCellTest, 'Agenda B Lama', '15 Feb', 'Agenda B Baru', '16 Feb');
testAssert(editRes.replaced === true, 'Berhasil menemukan dan menandai penggantian baris');
testAssert(editRes.lines[1] === 'Agenda B Baru\t16 Feb', 'Baris kedua berhasil diganti dengan nilai baru');
testAssert(editRes.lines[0] === 'Agenda A\t10 Jan' && editRes.lines[2] === 'Agenda C\t20 Mar', 'Baris lain tidak tersentuh');

// -------------------------------------------------------------
// TEST 6: Pengabaian Delegasi Khusus (Bpk, komisi, semua anggota)
// -------------------------------------------------------------
console.log('\n📌 Test 6: Pengabaian Delegasi Pembina & Non-Santri Secara Bersih');
function shouldSkipDelegasiLine(line) {
  if (!line || !line.trim()) return true;
  const raw = line.trim().toLowerCase();
  const stripped = raw.replace(/^(\d+[\.\)]|\-|\•)\s*/, '').trim();

  if (stripped.startsWith('bpk.') || stripped.startsWith('bapak')) return true;
  if (raw === '-' || stripped === '-' || stripped.startsWith('komisi') || stripped.startsWith('kom ') || stripped === 'kom a' || stripped === 'kom b') return true;
  if (raw.includes('semua anggota') || stripped.includes('semua anggota')) return true;
  if (stripped === 'izin' || stripped === 'batal' || stripped === 'nihil' || stripped === 'tidak ada') return true;

  return false;
}

testAssert(shouldSkipDelegasiLine('1. Bpk. Lukman Julianto') === true, 'Melewati "1. Bpk. Lukman Julianto"');
testAssert(shouldSkipDelegasiLine('Bpk. Riqi Sofa Al-Azizi') === true, 'Melewati "Bpk. Riqi Sofa Al-Azizi"');
testAssert(shouldSkipDelegasiLine('KOM A') === true, 'Melewati "KOM A"');
testAssert(shouldSkipDelegasiLine('KOM B') === true, 'Melewati "KOM B"');
testAssert(shouldSkipDelegasiLine('KOMISI A') === true, 'Melewati "KOMISI A"');
testAssert(shouldSkipDelegasiLine('-') === true, 'Melewati tanda strip "-"');
testAssert(shouldSkipDelegasiLine('Semua Anggota LBM') === true, 'Melewati "Semua Anggota LBM"');
testAssert(shouldSkipDelegasiLine('1. Muhammad Ziyada Fatan Tazkiya') === false, 'TIDAK melewati santri sah');

console.log(`\n🎉 SELURUH PENGUJIAN LOGIKA BERHASIL: ${passedTests}/${totalTests} pengujian lolos!\n`);
