'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  User,
  GraduationCap,
  Calendar,
  MapPin,
  Home,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
} from 'lucide-react';

const KELAS_OPTIONS = [
  '3 ALIYAH',
  '2 Aliyah',
  '2 M ALIYAH',
  '2 MA',
  '2 ALIYAH',
  '1 ALIYAH',
  '3 Tsanawiyah',
  '2 Tsanawiyah',
  '1 Tsanawiyah',
];

const PERKEMBANGAN_OPTIONS = [
  'SENIOR - SANGAT BAIK',
  'SENIOR - BAIK',
  'SENIOR - KURANG BAIK',
  'JUNIOR - SANGAT BAIK',
  'JUNIOR - BAIK',
  'DALAM MASA REPARASI',
  'ADAPTASI TOTAL',
  'TERANCAM KELUAR',
  'Belum Ada Status',
];

export default function EditBiodataModal({ anggota, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    perkembangan: '',
    ttl: '',
    alamat: '',
    domisili: '',
    ayahIbu: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sinkronkan form data setiap kali anggota terpilih berubah
  useEffect(() => {
    if (anggota) {
      setFormData({
        nama: anggota.nama || '',
        kelas: anggota.kelas && anggota.kelas !== '-' ? anggota.kelas : '',
        perkembangan: anggota.perkembangan || 'Belum Ada Status',
        ttl: anggota.ttl && anggota.ttl !== '-' ? anggota.ttl : '',
        alamat: anggota.alamat && anggota.alamat !== '-' ? anggota.alamat : '',
        domisili: anggota.domisili && anggota.domisili !== '-' ? anggota.domisili : '',
        ayahIbu: anggota.ayahIbu && anggota.ayahIbu !== '-' ? anggota.ayahIbu : '',
      });
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [anggota, isOpen]);

  // Handle tombol Escape & kunci scroll body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !anggota) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.nama.trim()) {
      setErrorMessage('Nama santri wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Siapkan payload perubahan
      const changes = {
        nama: formData.nama.trim(),
        kelas: formData.kelas.trim() || '-',
        perkembangan: formData.perkembangan.trim() || 'Belum Ada Status',
        ttl: formData.ttl.trim() || '-',
        alamat: formData.alamat.trim() || '-',
        domisili: formData.domisili.trim() || '-',
        ayahIbu: formData.ayahIbu.trim() || '-',
      };

      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true',
        },
        body: JSON.stringify({
          id: anggota.id,
          changes,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal menyimpan perubahan ke Google Sheets.');
      }

      setSuccessMessage(result.message || 'Biodata santri berhasil diperbarui di Google Sheets!');

      // Callback ke parent untuk memuat ulang data terbaru
      if (typeof onSuccess === 'function') {
        onSuccess({
          ...anggota,
          ...changes,
        });
      }

      // Tutup modal setelah delay singkat agar admin dapat melihat pesan sukses
      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Error simpan biodata:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan jaringan atau server saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { if (!isSaving) onClose(); }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#DCE5E0] overflow-hidden my-auto max-h-[94vh] flex flex-col z-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-title"
        >
          {/* Aksen Emas di Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D7A6F] via-[#C6A66B] to-[#1D7A6F]" />

          {/* Header Modal */}
          <div className="px-6 pt-6 pb-4 bg-[#F7F5EF] border-b border-[#DCE5E0] flex items-center justify-between gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D7A6F] bg-white px-2 py-0.5 rounded border border-[#DCE5E0] font-mono">
                  <Lock className="w-3 h-3 text-[#C6A66B]" />
                  ID: {anggota.id || 'LBM-XXX'}
                </span>
                <span className="text-xs text-[#5C6E66]">• Tab PERKEMBANGAN</span>
              </div>
              <h2 id="modal-edit-title" className="text-lg sm:text-xl font-bold text-[#26332E] font-serif">
                Edit Biodata Santri LBM
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 rounded-lg bg-white hover:bg-stone-100 text-[#5C6E66] hover:text-[#26332E] border border-[#DCE5E0] transition-colors disabled:opacity-50 cursor-pointer"
              title="Tutup (Esc)"
              aria-label="Tutup form edit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Isi Biodata */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(94vh-180px)]">
              
              {/* Alert Pesan Error */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#8A2F1B] mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Gagal Menyimpan:</p>
                    <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Alert Pesan Sukses */}
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-[#E8F5F3] border border-[#C8E3DC] text-[#1D7A6F] text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1D7A6F]" />
                  <span className="font-semibold leading-relaxed">{successMessage}</span>
                </div>
              )}

              {/* Input Nama Santri */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E66] mb-1.5">
                  Nama Santri <span className="text-[#8A2F1B]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isSaving}
                    value={formData.nama}
                    onChange={(e) => handleChange('nama', e.target.value)}
                    placeholder="Nama lengkap santri"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-[#DCE5E0] text-[#26332E] bg-white focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 disabled:bg-stone-50"
                  />
                </div>
                <p className="text-[11px] text-[#5C6E66] mt-1">
                  Nama ini akan diperbarui di lembar anggota serta daftar delegasi pemberangkatan terkait.
                </p>
              </div>

              {/* Grid 2 Kolom: Kelas & Status Perkembangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Input / Dropdown Kelas */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E66] mb-1.5">
                    Tingkatan Kelas
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      list="kelas-datalist"
                      disabled={isSaving}
                      value={formData.kelas}
                      onChange={(e) => handleChange('kelas', e.target.value)}
                      placeholder="Pilih atau ketik kelas"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-[#DCE5E0] text-[#26332E] bg-white focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 disabled:bg-stone-50"
                    />
                    <datalist id="kelas-datalist">
                      {KELAS_OPTIONS.map((k) => (
                        <option key={k} value={k} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Dropdown Status Perkembangan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E66] mb-1.5">
                    Status Perkembangan
                  </label>
                  <select
                    disabled={isSaving}
                    value={formData.perkembangan}
                    onChange={(e) => handleChange('perkembangan', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#DCE5E0] text-[#26332E] bg-white focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 disabled:bg-stone-50 cursor-pointer font-medium"
                  >
                    {PERKEMBANGAN_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Tempat Tanggal Lahir (TTL) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E66] mb-1.5">
                  Tempat, Tanggal Lahir (TTL)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={isSaving}
                    value={formData.ttl}
                    onChange={(e) => handleChange('ttl', e.target.value)}
                    placeholder="Contoh: Kediri, 03 Maret 2006"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-[#DCE5E0] text-[#26332E] bg-white focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 disabled:bg-stone-50"
                  />
                </div>
              </div>

              {/* Domisili Asrama di Pesantren */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E66] mb-1.5">
                  Domisili Asrama di Pesantren
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={isSaving}
                    value={formData.domisili}
                    onChange={(e) => handleChange('domisili', e.target.value)}
                    placeholder="Contoh: PPDS, Gedung A, Kamar 12"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-[#DCE5E0] text-[#26332E] bg-white focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 disabled:bg-stone-50"
                  />
                </div>
              </div>

              {/* Nama Orang Tua (Ayah / Ibu) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E66] mb-1.5">
                  Nama Orang Tua (Ayah / Ibu)
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={isSaving}
                    value={formData.ayahIbu}
                    onChange={(e) => handleChange('ayahIbu', e.target.value)}
                    placeholder="Contoh: Nur Rofiq, Muwassi'ah"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-[#DCE5E0] text-[#26332E] bg-white focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 disabled:bg-stone-50"
                  />
                </div>
              </div>

              {/* Alamat Lengkap Asal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E66] mb-1.5">
                  Alamat Asal Lengkap
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#5C6E66] absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    disabled={isSaving}
                    value={formData.alamat}
                    onChange={(e) => handleChange('alamat', e.target.value)}
                    placeholder="Dusun, RT/RW, Desa, Kecamatan, Kabupaten/Kota"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-[#DCE5E0] text-[#26332E] bg-white focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 disabled:bg-stone-50 resize-none"
                  />
                </div>
              </div>

            </div>

            {/* Footer Modal dengan Tombol Simpan & Batal */}
            <div className="p-4 sm:px-6 bg-[#F7F5EF] border-t border-[#DCE5E0] flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-[#5C6E66] hidden sm:inline">
                Tulis langsung ke tab PERKEMBANGAN
              </span>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-lg border border-[#DCE5E0] bg-white text-[#5C6E66] hover:text-[#26332E] hover:bg-stone-50 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D7A6F] hover:bg-[#155D54] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
