'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Info,
  Clock,
  CalendarDays,
  FileText,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { cleanMemberName, findAnggotaByDelegasiName } from '@/lib/fetchCSV';
import { BULAN_INDONESIA, formatIndonesianDate } from '@/lib/formatters';

export default function EditBahsuModal({
  isOpen,
  onClose,
  event = null, // null jika mode tambah baru
  suggestedNo = '',
  anggotaList = [],
  onSuccess,
}) {
  const isCreate = !event;

  const [no, setNo] = useState('');
  const [namaAcara, setNamaAcara] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [delegasi, setDelegasi] = useState('');
  const [keterangan, setKeterangan] = useState('SUDAH');
  const [customKeterangan, setCustomKeterangan] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPartialSuccess, setIsPartialSuccess] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const dateInputRef = useRef(null);

  // Inisialisasi formulir saat modal dibuka atau target event berganti
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setErrorMsg('');
        setSuccessMsg('');
        setIsPartialSuccess(false);
        setPickerSearch('');
        setShowPicker(false);

        if (event) {
          setShowPicker(false);
          setNo(event.no ? String(event.no) : '');

          // Pisahkan nama acara dan tempat jika terdapat tanda koma
          const rawAcara = event.acara || '';
          if (rawAcara.includes(',')) {
            const firstCommaIdx = rawAcara.indexOf(',');
            setNamaAcara(rawAcara.slice(0, firstCommaIdx).trim());
            setLokasi(rawAcara.slice(firstCommaIdx + 1).trim());
          } else {
            setNamaAcara(rawAcara.trim());
            setLokasi('');
          }

          setTanggal(event.tanggal || '');
          setDelegasi(
            Array.isArray(event.delegasi)
              ? event.delegasi.join('\n')
              : (event.delegasi || '')
          );

          const currentKet = (event.keterangan || '').trim();
          const upperKet = currentKet.toUpperCase();
          if (upperKet.includes('BELOM') || upperKet.includes('BELUM')) {
            setKeterangan('BELUM');
            setCustomKeterangan('');
          } else if (
            upperKet.includes('IZIN') ||
            upperKet.includes('BATAL') ||
            upperKet.includes('MUHAFADZOH') ||
            upperKet.includes('MUHAFAZOH') ||
            upperKet.includes('BERHALANGAN')
          ) {
            setKeterangan('IZIN');
            setCustomKeterangan(currentKet);
          } else if (upperKet.includes('SUDAH') || upperKet.includes('TERLAKSANA')) {
            setKeterangan('SUDAH');
            setCustomKeterangan('');
          } else if (currentKet) {
            setKeterangan('CUSTOM');
            setCustomKeterangan(currentKet);
          } else {
            setKeterangan('SUDAH');
            setCustomKeterangan('');
          }
        } else {
          // Mode Tambah Baru: buka daftar santri secara langsung agar mudah dipilih
          setShowPicker(true);
          setNo(suggestedNo ? String(suggestedNo) : '');
          setNamaAcara('');
          setLokasi('');
          setTanggal('');
          setDelegasi('');
          setKeterangan('SUDAH');
          setCustomKeterangan('');
        }
      });
    }
  }, [isOpen, event, suggestedNo]);

  // Gabungan nama acara & lokasi sesuai format riil di kolom B spreadsheet
  const finalAcaraCombined = useMemo(() => {
    const cleanNama = namaAcara.trim();
    const cleanLok = lokasi.trim();
    if (cleanNama && cleanLok) {
      return `${cleanNama}, ${cleanLok}`;
    }
    return cleanNama || cleanLok;
  }, [namaAcara, lokasi]);

  // Keterangan final yang akan disimpan ke Google Sheets
  const finalKeterangan = useMemo(() => {
    if (keterangan === 'IZIN') {
      const custom = customKeterangan.trim();
      if (!custom) return 'IZIN';
      // Jika teks kustom sudah mengandung kata 'izin' atau 'batal', gunakan langsung
      if (/^izin\b/i.test(custom) || custom.toUpperCase().includes('IZIN') || custom.toUpperCase().includes('BATAL')) {
        return custom;
      }
      // Jika teks kustom berisi alasan spesifik (misal 'persiapan muhafadzoh'),
      // bungkus dengan 'Izin (<alasan>)' agar selalu dikenali sebagai IZIN oleh backend & frontend
      return `Izin (${custom})`;
    }
    if (keterangan === 'BELUM') {
      const custom = customKeterangan.trim();
      if (custom && (custom.toUpperCase().includes('BELUM') || custom.toUpperCase().includes('BELOM'))) {
        return custom;
      }
      return 'BELUM';
    }
    if (keterangan === 'SUDAH') {
      const custom = customKeterangan.trim();
      if (custom && (custom.toUpperCase().includes('SUDAH') || custom.toUpperCase().includes('TERLAKSANA'))) {
        return custom;
      }
      return 'SUDAH';
    }
    if (keterangan === 'CUSTOM') {
      return customKeterangan.trim() || 'SUDAH';
    }
    return keterangan;
  }, [keterangan, customKeterangan]);

  // Deteksi real-time santri yang cocok dari teks delegasi
  const parsedDelegates = useMemo(() => {
    if (!delegasi) return { matched: [], nonMatched: [] };

    const lines = delegasi
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const matched = [];
    const nonMatched = [];

    lines.forEach((line) => {
      const clean = cleanMemberName(line);
      if (
        !clean ||
        clean.startsWith('komisi') ||
        clean.startsWith('kom ') ||
        clean === '-' ||
        clean.includes('semua anggota') ||
        clean === 'izin' ||
        clean === 'batal'
      ) {
        return;
      }

      const found = findAnggotaByDelegasiName(line, anggotaList);
      if (found) {
        if (!matched.some((m) => m.anggota.id === found.id)) {
          matched.push({ line, anggota: found });
        }
      } else {
        nonMatched.push(line);
      }
    });

    return { matched, nonMatched };
  }, [delegasi, anggotaList]);

  // Daftar santri untuk dropdown quick-picker
  const availableMembers = useMemo(() => {
    if (!pickerSearch.trim()) return anggotaList;
    const q = pickerSearch.toLowerCase();
    return anggotaList.filter(
      (a) =>
        a.nama.toLowerCase().includes(q) ||
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.kelas && a.kelas.toLowerCase().includes(q))
    );
  }, [anggotaList, pickerSearch]);

  // Tambahkan santri ke daftar delegasi secara teratur bernomor
  const handleAddMemberToDelegasi = (member) => {
    const lines = delegasi
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    // Cek apakah santri sudah ada di daftar
    const alreadyExists = lines.some((l) => {
      const c = cleanMemberName(l);
      return c === cleanMemberName(member.nama);
    });

    if (alreadyExists) return;

    const nextIndex = lines.length + 1;
    const newLine = `${nextIndex}. ${member.nama}`;
    const newDelegasi = lines.length > 0 ? `${delegasi.trim()}\n${newLine}` : newLine;
    setDelegasi(newDelegasi);
  };

  // Hapus santri dari daftar delegasi dan rapikan penomoran
  const handleRemoveMemberFromDelegasi = (member) => {
    const lines = delegasi
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const filtered = lines.filter((l) => {
      const c = cleanMemberName(l);
      return c !== cleanMemberName(member.nama);
    });

    let counter = 1;
    const renumbered = filtered.map((l) => {
      if (/^\d+[\.\)]\s*/.test(l)) {
        return l.replace(/^\d+[\.\)]\s*/, `${counter++}. `);
      }
      return l;
    });

    setDelegasi(renumbered.join('\n'));
  };

  // Tambahkan Komisi ke delegasi
  const handleAddKomisi = (komisiName) => {
    const lines = delegasi
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const newDelegasi = lines.length > 0 ? `${delegasi.trim()}\n${komisiName}` : komisiName;
    setDelegasi(newDelegasi);
  };

  // Pilih tanggal dari date picker native
  const handleDatePicked = (e) => {
    const val = e.target.value;
    if (val) {
      setTanggal(formatIndonesianDate(val));
    }
  };

  // Pengiriman formulir ke backend /api/sheets
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validasi Kolom Wajib
    const trimmedAcara = finalAcaraCombined.trim();
    if (!trimmedAcara) {
      setErrorMsg('Nama kegiatan atau agenda Bahtsul Masail wajib diisi.');
      return;
    }

    const trimmedTanggal = tanggal.trim();
    if (!trimmedTanggal) {
      setErrorMsg('Tanggal pelaksanaan kegiatan Bahtsul Masail wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Kumpulkan identitas lengkap dan terverifikasi dari santri yang dipilih
      const selectedStudents = parsedDelegates.matched.map((m) => ({
        id: m.anggota.id,
        noOriginal: m.anggota.noOriginal,
        nama: m.anggota.nama,
        kelas: m.anggota.kelas,
      }));
      const matchedMemberIds = selectedStudents.map((s) => s.id);

      const payload = {
        action: 'syncBahsuEvent',
        event: {
          mode: isCreate ? 'create' : 'edit',
          rowNumber: event?.id !== undefined ? event.id + 1 : null,
          no: no.trim(),
          newAcara: trimmedAcara,
          newTanggal: trimmedTanggal,
          delegasi: delegasi.trim(),
          keterangan: finalKeterangan,
          selectedStudents,
          matchedMemberIds,
          oldAcara: event ? (event.acara || '').trim() : '',
          oldTanggal: event ? (event.tanggal || '').trim() : '',
        },
      };

      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan agenda ke Google Sheets.');
      }

      const isPartial = Boolean(data.isPartial || data.data?.isPartial);
      setIsPartialSuccess(isPartial);
      const syncCount = data.data?.syncedCount ?? 0;

      let successText = '';
      if (isPartial) {
        successText = data.message || '⚠️ Agenda berhasil disimpan ke DAFTAR PEMBERANGKATAN BAHSU, namun tidak ada santri LBM yang cocok untuk disinkronkan ke sheet PERKEMBANGAN.';
      } else if (isCreate) {
        successText = `Agenda berhasil ditambahkan ke DAFTAR PEMBERANGKATAN BAHSU dan disinkronkan ke ${syncCount} riwayat santri di tab PERKEMBANGAN!`;
      } else {
        successText = data.message || `Perubahan agenda Bahtsul Masail berhasil disimpan ke Google Sheets (tersinkron ke ${syncCount} santri).`;
      }

      setSuccessMsg(successText);

      // Berikan jeda sejenak agar pengguna membaca notifikasi (lebih lama untuk peringatan parsial)
      setTimeout(() => {
        if (typeof onSuccess === 'function') {
          const derivedStatus = keterangan === 'IZIN'
            ? 'IZIN'
            : (keterangan === 'BELUM' ? 'BELUM_BERANGKAT' : 'SUDAH_BERANGKAT');

          const savedEventData = {
            ...(data.data?.event || {}),
            targetId: event?.id,
            targetNo: event?.no,
            oldAcara: event ? (event.acara || '').trim() : '',
            no: no.trim(),
            acara: trimmedAcara,
            tanggal: trimmedTanggal,
            delegasi: delegasi.trim().split(/\r?\n/).filter(Boolean),
            keterangan: finalKeterangan,
            statusKeberangkatan: data.data?.event?.statusKeberangkatan || derivedStatus,
          };
          onSuccess(savedEventData);
        }
        onClose();
      }, isPartial ? 3000 : 1500);

    } catch (err) {
      console.error('Error saat menyimpan kegiatan bahtsu:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan atau server saat menghubungi Google Sheets.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#DCE5E0] shadow-2xl overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#F7F5EF] border-b border-[#DCE5E0]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white text-[#1D7A6F] flex items-center justify-center border border-[#DCE5E0] shadow-2xs shrink-0">
              <Calendar className="w-5 h-5 text-[#1D7A6F]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#26332E] font-serif truncate">
                {isCreate ? 'Tambah Agenda Bahtsul Masail' : 'Edit Agenda & Sinkronisasi Bahtsu'}
              </h2>
              <p className="text-xs text-[#5C6E66] truncate">
                {isCreate
                  ? 'Menyimpan langsung ke DAFTAR PEMBERANGKATAN BAHSU & tab PERKEMBANGAN'
                  : 'Perbarui data kegiatan dan riwayat delegasi santri pada Google Sheets'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#5C6E66] hover:text-[#26332E] hover:bg-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Banner Notifikasi Error */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8A2F1B]" />
              <div className="leading-relaxed font-semibold">{errorMsg}</div>
            </div>
          )}

          {/* Banner Notifikasi Sukses / Sukses Parsial */}
          {successMsg && (
            <div
              className={`flex items-start gap-3 p-3.5 rounded-xl text-xs animate-in fade-in duration-150 ${
                isPartialSuccess
                  ? 'bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]'
                  : 'bg-[#E8F5F3] border border-[#C8E3DC] text-[#1D7A6F]'
              }`}
            >
              {isPartialSuccess ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#1D7A6F]" />
              )}
              <div className="leading-relaxed font-bold">{successMsg}</div>
            </div>
          )}

          {/* Baris 1: Nomor Urut Agenda & Tanggal Pelaksanaan */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
            
            {/* Nomor Urut Agenda */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
                Nomor Agenda (No.)
              </label>
              <input
                type="text"
                value={no}
                onChange={(e) => setNo(e.target.value)}
                placeholder="Misal: 34"
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-sm text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] font-mono"
              />
              <span className="text-[10px] text-[#5C6E66] mt-0.5 block">
                {isCreate ? 'Otomatis dihitung urutan berikutnya' : 'Nomor baris pada tabel'}
              </span>
            </div>

            {/* Tanggal Pelaksanaan */}
            <div className="sm:col-span-8">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider">
                  Tanggal Pelaksanaan <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D7A6F] hover:underline cursor-pointer"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Pilih Kalender</span>
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    onChange={handleDatePicked}
                    className="sr-only"
                    tabIndex={-1}
                  />
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  placeholder="Contoh: 18 Mei 2026 M. / 11-12 Juli 2026 M."
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-sm text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-[10px] text-[#5C6E66]">Pilihan cepat:</span>
                <button
                  type="button"
                  onClick={() => setTanggal(formatIndonesianDate(new Date().toISOString().split('T')[0]))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F5EF] text-[#1D7A6F] hover:bg-[#E8F5F3] border border-[#DCE5E0] cursor-pointer"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setTanggal('Menunggu Jadwal')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F5EF] text-[#8C6D23] hover:bg-[#FAF3E6] border border-[#DCE5E0] cursor-pointer"
                >
                  Menunggu Jadwal
                </button>
              </div>
            </div>

          </div>

          {/* Baris 2: Nama Acara / Forum & Tempat Penyelenggara */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
                Nama Forum / Acara Bahtsul Masail <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaAcara}
                onChange={(e) => setNamaAcara(e.target.value)}
                placeholder="Contoh: LBM MWC NU Badas / FMPP Se-Jawa Madura Ke-45 / BMK Ke-18"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-sm text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
                Lokasi / Pesantren Penyelenggara
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: PP. Salafiyah Kholidiyah Plumpang TUBAN / Aula Al-Ikhlas"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-sm text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F]"
                />
              </div>
            </div>

            {/* Pratinjau Teks Kolom B Spreadsheet */}
            {finalAcaraCombined && (
              <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#DCE5E0] text-xs flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-[#1D7A6F] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[#5C6E66] text-[11px] block">Tersimpan di Sheets (Kolom B: Bahtsul Masail):</span>
                  <span className="font-bold text-[#26332E] break-words">{finalAcaraCombined}</span>
                </div>
              </div>
            )}
          </div>

          {/* Baris 3: Status Keberangkatan */}
          <div>
            <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
              Status Kegiatan
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setKeterangan('SUDAH');
                  setCustomKeterangan('');
                }}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  keterangan === 'SUDAH'
                    ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-2xs'
                    : 'bg-[#F7F5EF] text-[#5C6E66] border-[#DCE5E0] hover:border-[#1D7A6F]'
                }`}
              >
                ✓ Terlaksana (SUDAH)
              </button>
              <button
                type="button"
                onClick={() => {
                  setKeterangan('BELUM');
                  setCustomKeterangan('');
                }}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  keterangan === 'BELUM'
                    ? 'bg-[#C6A66B] text-white border-[#C6A66B] shadow-2xs'
                    : 'bg-[#F7F5EF] text-[#5C6E66] border-[#DCE5E0] hover:border-[#C6A66B]'
                }`}
              >
                ⏳ Menunggu (BELUM)
              </button>
              <button
                type="button"
                onClick={() => {
                  setKeterangan('IZIN');
                }}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  keterangan === 'IZIN'
                    ? 'bg-[#8A2F1B] text-white border-[#8A2F1B] shadow-2xs'
                    : 'bg-[#F7F5EF] text-[#5C6E66] border-[#DCE5E0] hover:border-[#8A2F1B]'
                }`}
              >
                ✕ Izin / Batal
              </button>
            </div>

            {/* Input Keterangan Kustom (misal alasan izin atau detail status) */}
            {(keterangan === 'IZIN' || keterangan === 'CUSTOM') && (
              <div className="mt-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={customKeterangan}
                  onChange={(e) => setCustomKeterangan(e.target.value)}
                  placeholder="Keterangan spesifik (opsional), misal: Persiapan Muhafadzoh / Surat Terlambat"
                  disabled={isSubmitting}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-xs text-[#26332E] focus:outline-hidden focus:border-[#1D7A6F]"
                />
              </div>
            )}
          </div>

          {/* Baris 4: Delegasi Santri */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider">
                Pilih Siswa / Delegasi Santri LBM <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D7A6F] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showPicker ? 'Tutup Daftar Santri' : 'Buka Daftar Santri LBM'}</span>
                </button>
              </div>
            </div>

            {/* Quick Picker Anggota LBM Dropdown */}
            {showPicker && (
              <div className="mb-3 p-3 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1D7A6F] uppercase tracking-wider">
                    Daftar Santri Anggota LBM ({anggotaList.length} Santri)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddKomisi('KOMISI A')}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#1D7A6F] border border-[#C8E3DC] hover:bg-[#1D7A6F] hover:text-white transition-colors cursor-pointer"
                    >
                      + Komisi A
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddKomisi('KOMISI B')}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#1D7A6F] border border-[#C8E3DC] hover:bg-[#1D7A6F] hover:text-white transition-colors cursor-pointer"
                    >
                      + Komisi B
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#DCE5E0]">
                  <Search className="w-3.5 h-3.5 text-[#5C6E66]" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Cari nama santri / kelas / ID untuk memilih..."
                    className="w-full text-xs text-[#26332E] focus:outline-hidden"
                  />
                  {pickerSearch && (
                    <button
                      type="button"
                      onClick={() => setPickerSearch('')}
                      className="text-[#5C6E66] hover:text-[#26332E] text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 divide-y divide-[#DCE5E0]/40">
                  {availableMembers.length > 0 ? (
                    availableMembers.map((a) => {
                      const isSelected = parsedDelegates.matched.some((m) => m.anggota.id === a.id);
                      return (
                        <div
                          key={a.id}
                          className={`pt-1.5 first:pt-0 flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                            isSelected ? 'bg-[#E8F5F3]/60' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10px] text-[#1D7A6F] font-bold shrink-0 bg-white px-1 py-0.5 rounded border border-[#C8E3DC]">
                              {a.id}
                            </span>
                            <span className="text-[#26332E] font-medium truncate">{a.nama}</span>
                            <span className="text-[10px] text-[#5C6E66] shrink-0">({a.kelas})</span>
                          </div>
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveMemberFromDelegasi(a)}
                              className="text-[11px] text-[#8A2F1B] font-semibold hover:underline cursor-pointer shrink-0 ml-2 flex items-center gap-1"
                              title="Hapus dari daftar delegasi"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#1D7A6F]" />
                              <span>Terpilih (✕)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddMemberToDelegasi(a)}
                              className="text-[11px] text-[#1D7A6F] font-bold hover:underline cursor-pointer shrink-0 ml-2"
                              title="Tambahkan ke delegasi"
                            >
                              + Pilih
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-[11px] text-[#5C6E66]">
                      Santri tidak ditemukan dengan kata kunci tersebut.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tampilan Chips Santri Terpilih */}
            {parsedDelegates.matched.length > 0 && (
              <div className="space-y-1.5 mb-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1D7A6F] uppercase tracking-wider">
                    Santri Terpilih ({parsedDelegates.matched.length} Siswa):
                  </span>
                  <span className="text-[10px] text-[#5C6E66]">
                    Klik ✕ untuk menghapus dari delegasi
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-[#F7F5EF] rounded-xl border border-[#DCE5E0]">
                  {parsedDelegates.matched.map((m) => (
                    <span
                      key={m.anggota.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#C8E3DC] text-xs text-[#26332E] shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1D7A6F] shrink-0" />
                      <span className="font-mono text-[10px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-1 py-0.5 rounded">
                        {m.anggota.id}
                      </span>
                      <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                        {m.anggota.nama}
                      </span>
                      <span className="text-[10px] text-[#5C6E66] shrink-0">({m.anggota.kelas})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberFromDelegasi(m.anggota)}
                        disabled={isSubmitting}
                        className="p-0.5 rounded-full hover:bg-[#FAF0ED] text-[#5C6E66] hover:text-[#8A2F1B] cursor-pointer ml-1 transition-colors"
                        title={`Hapus ${m.anggota.nama} dari daftar`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <label className="block text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider mb-1">
              Teks Delegasi Lengkap (Disimpan ke DAFTAR PEMBERANGKATAN BAHSU)
            </label>
            <textarea
              rows={3}
              value={delegasi}
              onChange={(e) => setDelegasi(e.target.value)}
              placeholder="Contoh:&#10;1. Bpk. Lukman Julianto&#10;2. Abdul Hakim Ibnu Asyhari&#10;3. Muhammad Aufilana Zulfa Hasan"
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-xs font-mono text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] leading-relaxed"
            />
            <span className="text-[10px] text-[#5C6E66] mt-0.5 block">
              Nama pembina, alumni, atau tamu dapat ditambahkan pada teks di atas. Hanya siswa anggota LBM yang akan disinkronkan ke sheet PERKEMBANGAN.
            </span>
          </div>

          {/* Pratinjau Sinkronisasi ke Sheet PERKEMBANGAN */}
          <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1D7A6F]">
              <Sparkles className="w-4 h-4 text-[#C6A66B]" />
              <span>Pratinjau Sinkronisasi Riwayat ke Sheet PERKEMBANGAN (Kolom J):</span>
            </div>

            {keterangan === 'IZIN' ? (
              <p className="text-[11px] text-[#8A2F1B] font-medium leading-relaxed">
                ℹ️ Status Izin / Batal: Riwayat kehadiran tidak akan ditambahkan ke kolom BAHTSU YANG DIDATANGI siswa.
              </p>
            ) : parsedDelegates.matched.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] text-[#5C6E66] leading-relaxed">
                  Kolom <span className="font-bold text-[#26332E]">J (BAHTSU YANG DIDATANGI)</span> pada {parsedDelegates.matched.length} baris siswa berikut akan otomatis ditambahkan riwayat agenda ini:
                </p>
                <div className="p-2 rounded-lg bg-white border border-[#C8E3DC] text-[11px] font-mono text-[#1D7A6F] space-y-1">
                  <div>
                    <span className="text-[#5C6E66] font-sans">Data yang ditambahkan ke Kolom J:</span>{' '}
                    <span className="font-bold text-[#26332E]">{finalAcaraCombined || '(Nama Acara)'} {tanggal || '(Tanggal)'}</span>
                  </div>
                  <div className="text-[10px] text-[#5C6E66] font-sans">
                    ✓ Catatan lama di Kolom J dipertahankan dan penulisan ganda dicegah otomatis.
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#8A2F1B] font-medium leading-relaxed">
                ⚠️ Belum ada santri anggota LBM yang dipilih. Silakan pilih minimal 1 nama santri pada daftar di atas agar data kegiatan tersinkronkan ke Kolom J sheet PERKEMBANGAN.
              </p>
            )}

            {parsedDelegates.nonMatched.length > 0 && (
              <div className="pt-1 text-[11px] text-[#5C6E66] flex items-start gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C6A66B]" />
                <span>
                  {parsedDelegates.nonMatched.length} nama pembina / alumni tercatat di sheet DAFTAR PEMBERANGKATAN BAHSU tanpa mengubah baris di sheet PERKEMBANGAN.
                </span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE5E0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#5C6E66] hover:bg-[#F7F5EF] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !namaAcara.trim() || !tanggal.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D7A6F] hover:bg-[#165E55] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Google Sheets &amp; Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCreate ? 'Simpan Agenda Baru' : 'Simpan Perubahan'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
