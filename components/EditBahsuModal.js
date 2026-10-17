'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { cleanMemberName, findAnggotaByDelegasiName } from '@/lib/fetchCSV';

export default function EditBahsuModal({
  isOpen,
  onClose,
  event = null, // null jika mode tambah baru
  anggotaList = [],
  onSuccess,
}) {
  const isCreate = !event;

  const [no, setNo] = useState('');
  const [acara, setAcara] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [delegasi, setDelegasi] = useState('');
  const [keterangan, setKeterangan] = useState('SUDAH');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pickerSearch, setPickerSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Inisialisasi formulir saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setPickerSearch('');
      setShowPicker(false);

      if (event) {
        setNo(event.no || '');
        setAcara(event.acara || '');
        setTanggal(event.tanggal || '');
        setDelegasi(
          Array.isArray(event.delegasi)
            ? event.delegasi.join('\n')
            : (event.delegasi || '')
        );
        setKeterangan(event.keterangan || 'SUDAH');
      } else {
        setNo('');
        setAcara('');
        setTanggal('');
        setDelegasi('');
        setKeterangan('SUDAH');
      }
    }
  }, [isOpen, event]);

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
      if (!clean || clean.startsWith('komisi') || clean.startsWith('kom ') || clean === '-' || clean.includes('semua anggota')) {
        return;
      }

      const found = findAnggotaByDelegasiName(line, anggotaList);
      if (found) {
        if (!matched.some((m) => m.id === found.id)) {
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
        a.id.toLowerCase().includes(q) ||
        (a.kelas && a.kelas.toLowerCase().includes(q))
    );
  }, [anggotaList, pickerSearch]);

  // Tambahkan santri ke daftar delegasi secara rapi
  const handleAddMemberToDelegasi = (member) => {
    const lines = delegasi
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    // Cek apakah santri sudah tercatat
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acara.trim()) {
      setErrorMsg('Nama agenda Bahtsul Masail (acara) wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        action: 'syncBahsuEvent',
        event: {
          mode: isCreate ? 'create' : 'edit',
          rowNumber: event?.id !== undefined ? event.id + 1 : null,
          no: no.trim(),
          newAcara: acara.trim(),
          newTanggal: tanggal.trim(),
          delegasi: delegasi.trim(),
          keterangan: keterangan.trim(),
          oldAcara: event ? (event.acara || '').trim() : '',
          oldTanggal: event ? (event.tanggal || '').trim() : '',
        },
      };

      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan perubahan ke Google Sheets.');
      }

      setSuccessMsg(
        data.message ||
          'Kegiatan Bahtsul Masail berhasil disimpan & disinkronkan ke sheet PERKEMBANGAN.'
      );

      // Berikan jeda sebentar agar notifikasi terbaca
      setTimeout(() => {
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
        onClose();
      }, 1400);

    } catch (err) {
      console.error('Error saat menyimpan kegiatan bahsu:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#DCE5E0] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-[#F7F5EF] border-b border-[#DCE5E0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#1D7A6F] flex items-center justify-center border border-[#DCE5E0] shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#26332E] font-serif">
                {isCreate ? 'Tambah Agenda Bahtsul Masail' : 'Edit Agenda & Sinkronisasi Bahtsu'}
              </h2>
              <p className="text-xs text-[#5C6E66]">
                {isCreate
                  ? 'Menambahkan agenda baru ke DAFTAR PEMBERANGKATAN & menyinkronkan ke PERKEMBANGAN'
                  : 'Perubahan otomatis tersimpan ke tab DAFTAR PEMBERANGKATAN & tab PERKEMBANGAN'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#5C6E66] hover:text-[#26332E] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status Messages */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#E8F5F3] border border-[#C8E3DC] text-[#1D7A6F] text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{successMsg}</div>
            </div>
          )}

          {/* Grid: No & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
                Nomor Agenda
              </label>
              <input
                type="text"
                value={no}
                onChange={(e) => setNo(e.target.value)}
                placeholder="Misal: 4"
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-sm text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
                Tanggal Pelaksanaan <span className="text-[#C6A66B]">*</span>
              </label>
              <input
                type="text"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                placeholder="Contoh: 18 Mei 2026 M. / 11-12 Juli 2026 M."
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-sm text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F]"
              />
            </div>
          </div>

          {/* Forum Bahtsul Masail (Acara & Tempat) */}
          <div>
            <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
              Nama Kegiatan &amp; Tempat Bahtsul Masail <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={acara}
              onChange={(e) => setAcara(e.target.value)}
              placeholder="Contoh: LBM MWC NU Badas, Musholla Miftahul Akbar Dsn. Mangiran Ds. Lamong"
              required
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-sm text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] leading-snug"
            />
          </div>

          {/* Status Keterangan Keberangkatan */}
          <div>
            <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider mb-1.5">
              Status Keberangkatan
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {['SUDAH', 'BELUM', 'IZIN'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setKeterangan(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    keterangan.toUpperCase().includes(opt)
                      ? 'bg-[#1D7A6F] text-white border-[#1D7A6F]'
                      : 'bg-[#F7F5EF] text-[#5C6E66] border-[#DCE5E0] hover:border-[#1D7A6F]'
                  }`}
                >
                  {opt === 'SUDAH' ? '✓ Terlaksana (SUDAH)' : opt === 'BELUM' ? '⏳ Menunggu (BELUM)' : '✕ Izin / Kendala'}
                </button>
              ))}
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Atau ketik keterangan kustom..."
                className="grow px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-xs text-[#26332E] focus:outline-hidden focus:border-[#1D7A6F]"
              />
            </div>
          </div>

          {/* Delegasi Santri */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#5C6E66] uppercase tracking-wider">
                Daftar Delegasi Santri (Baris demi Baris)
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D7A6F] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pilih dari Anggota LBM</span>
              </button>
            </div>

            {/* Quick Picker Anggota Dropdown */}
            {showPicker && (
              <div className="mb-3 p-3 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#DCE5E0]">
                  <Search className="w-3.5 h-3.5 text-[#5C6E66]" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Cari santri berdasarkan nama / kelas..."
                    className="w-full text-xs text-[#26332E] focus:outline-hidden"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-[#DCE5E0]/40">
                  {availableMembers.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => handleAddMemberToDelegasi(a)}
                      className="pt-1 first:pt-0 flex items-center justify-between px-2 py-1 hover:bg-white rounded cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#1D7A6F] font-bold">
                          {a.id}
                        </span>
                        <span className="text-[#26332E] font-medium">{a.nama}</span>
                        <span className="text-[10px] text-[#5C6E66]">({a.kelas})</span>
                      </div>
                      <span className="text-[10px] text-[#1D7A6F] font-bold">+ Tambah</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              rows={4}
              value={delegasi}
              onChange={(e) => setDelegasi(e.target.value)}
              placeholder="Contoh:&#10;1. Bpk. Lukman Julianto&#10;2. Abdul Hakim Ibnu Asyhari&#10;3. Muhammad Aufilana Zulfa Hasan"
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] bg-white text-xs font-mono text-[#26332E] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] leading-relaxed"
            />
          </div>

          {/* Real-time Preview Sinkronisasi ke Sheet PERKEMBANGAN */}
          <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1D7A6F]">
              <Sparkles className="w-4 h-4 text-[#C6A66B]" />
              <span>Pratinjau Sinkronisasi ke Sheet PERKEMBANGAN:</span>
            </div>

            {parsedDelegates.matched.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] text-[#5C6E66]">
                  Kolom <span className="font-semibold text-[#26332E]">BAHTSU YANG DIDATANGI</span> pada {parsedDelegates.matched.length} santri berikut akan otomatis diperbarui:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                  {parsedDelegates.matched.map((m) => (
                    <span
                      key={m.anggota.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#C8E3DC] text-[11px] font-medium text-[#1D7A6F]"
                      title={m.anggota.nama}
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#1D7A6F]" />
                      <span className="font-mono text-[10px]">{m.anggota.id}</span>
                      <span>{m.anggota.nama}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#5C6E66] italic">
                Belum ada nama santri anggota LBM yang terdeteksi dari daftar delegasi di atas.
              </p>
            )}

            {parsedDelegates.nonMatched.length > 0 && (
              <div className="pt-1 text-[11px] text-[#5C6E66] flex items-start gap-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5 text-[#C6A66B]" />
                <span>
                  {parsedDelegates.nonMatched.length} nama non-anggota santri (misal pembina/sesepuh) tetap tercatat di sheet DAFTAR PEMBERANGKATAN tanpa mengubah sheet PERKEMBANGAN.
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
              className="px-4 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#5C6E66] hover:bg-[#F7F5EF] text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !acara.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1D7A6F] hover:bg-[#165E55] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Sheets...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan &amp; Sinkronkan Data</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
