'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { STATUS_COLORS } from './PieChart';

const DEFAULT_STYLING = {
  color: '#64748B',
  bgBadge: 'bg-gray-100',
  textBadge: 'text-gray-700',
  border: 'border-gray-200',
};

// Varian animasi modal container
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 25,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 26,
      stiffness: 340,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 15,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

// Varian stagger untuk elemen konten modal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function AnggotaDetailModal({ anggota, onClose }) {
  // Tutup modal jika tombol Escape ditekan & kunci scroll halaman
  useEffect(() => {
    if (!anggota) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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
  }, [anggota, onClose]);

  if (!anggota) return null;

  const styling = STATUS_COLORS[anggota.perkembangan] || DEFAULT_STYLING;
  const bahtsuCount = anggota.bahtsuList?.length || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        
        {/* Overlay backdrop dengan efek blur dan fade in/out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#2A9D8F]/25 overflow-hidden my-auto max-h-[92vh] flex flex-col z-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-anggota-title"
        >
          
          {/* Header Modal */}
          <div className="relative px-6 pt-7 pb-6 bg-gradient-to-br from-[#E8F5F3] via-[#F4FAF8] to-[#FFFCF5] border-b border-[#2A9D8F]/15 shrink-0">
            {/* Tombol Close (X) dengan animasi rotasi saat hover */}
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 shadow-xs border border-gray-200 transition-colors cursor-pointer"
              aria-label="Tutup detail santri"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="flex items-start gap-4 pr-10">
              {/* Avatar Santri dengan inisial */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#1D7A6F] to-[#2A9D8F] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shadow-[#2A9D8F]/20 shrink-0 border-2 border-white">
                {anggota.nama
                  ? anggota.nama
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'S'}
              </div>

              {/* Nama & Tagline */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1D7A6F] mb-1">
                  <span className="bg-white/90 px-2 py-0.5 rounded-md border border-[#2A9D8F]/20">
                    No. Urut #{anggota.urutan || anggota.noOriginal || '-'}
                  </span>
                  <span>•</span>
                  <span>Santri LBM</span>
                </div>

                <h2
                  id="modal-anggota-title"
                  className="text-xl sm:text-2xl font-black text-[#2D3436] tracking-tight leading-tight break-words"
                >
                  {anggota.nama}
                </h2>

                {/* Badge Status Perkembangan & Kelas */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${styling.bgBadge} ${styling.textBadge} ${styling.border}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                      style={{ backgroundColor: styling.color }}
                    />
                    {anggota.perkembangan}
                  </span>

                  {anggota.kelas && anggota.kelas !== '-' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
                      Kelas {anggota.kelas}
                    </span>
                  )}

                  {anggota.domisili && anggota.domisili !== '-' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2A9D8F]/10 text-[#1D7A6F] border border-[#2A9D8F]/20">
                      <Home className="w-3.5 h-3.5" />
                      {anggota.domisili}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Isi Konten Modal (Scrollable dengan Stagger Animation) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-180px)]"
          >
            
            {/* Bagian 1: Informasi Pribadi */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#2A9D8F]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Informasi Pribadi &amp; Domisili
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Tempat, Tanggal Lahir (TTL) */}
                <div className="p-3.5 rounded-2xl bg-[#FFFCF5] border border-gray-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Tempat, Tanggal Lahir (TTL)
                    </p>
                    <p className="text-sm font-semibold text-[#2D3436] mt-0.5">
                      {anggota.ttl && anggota.ttl !== '-' ? anggota.ttl : (
                        <span className="text-gray-400 italic font-normal">Belum ada data TTL</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Domisili Asrama */}
                <div className="p-3.5 rounded-2xl bg-[#FFFCF5] border border-gray-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Domisili di Pesantren
                    </p>
                    <p className="text-sm font-semibold text-[#2D3436] mt-0.5">
                      {anggota.domisili && anggota.domisili !== '-' ? anggota.domisili : (
                        <span className="text-gray-400 italic font-normal">Belum ditentukan</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Nama Orang Tua (Ayah / Ibu) */}
                <div className="p-3.5 rounded-2xl bg-[#FFFCF5] border border-gray-100 flex items-start gap-3 sm:col-span-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Nama Orang Tua (Ayah / Ibu)
                    </p>
                    <p className="text-sm font-semibold text-[#2D3436] mt-0.5">
                      {anggota.ayahIbu && anggota.ayahIbu !== '-' ? anggota.ayahIbu : (
                        <span className="text-gray-400 italic font-normal">Belum ada data orang tua</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div className="p-3.5 rounded-2xl bg-[#FFFCF5] border border-gray-100 flex items-start gap-3 sm:col-span-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Alamat Asal
                    </p>
                    <p className="text-sm font-semibold text-[#2D3436] mt-0.5">
                      {anggota.alamat && anggota.alamat !== '-' ? anggota.alamat : (
                        <span className="text-gray-400 italic font-normal">Belum ada data alamat</span>
                      )}
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Bagian 2: Daftar Bahtsul Masail yang Dihadiri */}
            <motion.div variants={itemVariants} className="pt-2">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#2A9D8F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                    Daftar Bahtsul Masail yang Dihadiri
                  </h3>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5F3] text-[#1D7A6F] border border-[#2A9D8F]/20">
                  <Award className="w-3.5 h-3.5" />
                  {bahtsuCount} Forum
                </span>
              </div>

              {bahtsuCount > 0 ? (
                <div className="space-y-2.5">
                  {anggota.bahtsuList.map((item, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01, x: 2 }}
                      transition={{ duration: 0.15 }}
                      className="p-3.5 rounded-2xl bg-white border border-gray-200/80 hover:border-[#2A9D8F]/50 hover:bg-[#FFFCF5] shadow-2xs flex items-start gap-3 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#E8F5F3] text-[#1D7A6F] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#2A9D8F]/20">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-[#2D3436] leading-relaxed">
                          {item}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#FFFCF5] border border-dashed border-gray-200 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2.5">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">
                    Belum ada data bahtsu yang dihadiri
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Santri ini belum tercatat mengikuti delegasi forum Bahtsul Masail pada spreadsheet LBM.
                  </p>
                </div>
              )}
            </motion.div>

          </motion.div>

          {/* Footer Modal */}
          <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-gray-500 truncate">
              Data terhubung ke Google Sheets WAKA III
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
