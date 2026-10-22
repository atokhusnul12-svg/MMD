'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  Printer,
  Calendar,
  Layers,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  Percent,
  Search,
  RefreshCw,
  ExternalLink,
  Tag,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { DATA_LINKS } from '@/lib/dataLinks';
import { formatRupiah, fetchDetailSheetData } from '@/lib/fetchCSV';

// Varian animasi modal container
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 20,
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
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/**
 * Mencocokkan nama bulan / periode dengan sheet detail Google Sheets yang tersedia
 */
function getMatchingSheets(bulanName, allSheets = []) {
  if (!allSheets || allSheets.length === 0) return [];
  const b = String(bulanName || '').toLowerCase();

  if (b === 'total' || b.includes('semua') || b.includes('akumulasi')) {
    return allSheets;
  }
  if (b.includes('dzulqo') || b.includes('dzulqa') || b.includes('syawal')) {
    return allSheets.filter((s) => s.id.startsWith('dzulqadah'));
  }
  if (b.includes('dzulhijjah')) {
    return allSheets.filter((s) => s.id.startsWith('dzulhijjah'));
  }
  if (b.includes('muharrom')) {
    return allSheets.filter((s) => s.id.startsWith('muharrom'));
  }
  if (b.includes('awwal')) {
    return allSheets.filter((s) => s.id === 'rawwal');
  }
  if (b.includes('tsani')) {
    return allSheets.filter((s) => s.id === 'rtsani');
  }

  // Fallback: cari substring nama sheet yang cocok
  const matched = allSheets.filter((s) => b.includes(s.name.toLowerCase()));
  return matched.length > 0 ? matched : allSheets;
}

export default function KeuanganDetailModal({
  isOpen,
  onClose,
  item,
  allRekap = [],
  totalData = null,
  catatanBerikutnya = [],
}) {
  const detailSheets = useMemo(() => DATA_LINKS.keuangan.detailSheets || [], []);

  // Filter sheet yang relevan dengan periode yang dipilih
  const relevantSheets = useMemo(() => {
    if (!item?.bulan) return detailSheets;
    return getMatchingSheets(item.bulan, detailSheets);
  }, [item, detailSheets]);

  const [selectedSheetUrl, setSelectedSheetUrl] = useState('');
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // URL sheet yang aktif: gunakan pilihan pengguna jika ada di relevantSheets, atau sheet pertama
  const activeSheetUrl = useMemo(() => {
    if (selectedSheetUrl && relevantSheets.some((s) => s.csvUrl === selectedSheetUrl)) {
      return selectedSheetUrl;
    }
    return relevantSheets[0]?.csvUrl || '';
  }, [selectedSheetUrl, relevantSheets]);

  // Reset filter saat item/bulan berganti
  const prevBulanRef = React.useRef(item?.bulan);
  useEffect(() => {
    if (prevBulanRef.current !== item?.bulan) {
      prevBulanRef.current = item?.bulan;
      setSelectedSheetUrl('');
      setSearchQuery('');
      setSelectedCategory('ALL');
    }
  }, [item?.bulan]);

  // Fetch sheet data saat modal terbuka & activeSheetUrl berubah
  useEffect(() => {
    if (!isOpen || !activeSheetUrl) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    fetchDetailSheetData(activeSheetUrl)
      .then((res) => {
        if (isMounted) {
          setSheetData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error load detail sheet:', err);
          setError(err?.message || 'Gagal memuat rincian data keuangan dari Google Sheets.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, activeSheetUrl]);

  // Tutup modal jika tombol Escape ditekan & kunci scroll halaman
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  // Daftar kategori yang tersedia di dalam sheet yang sedang dibuka
  const availableCategories = useMemo(() => {
    if (!sheetData?.sections) return [];
    return sheetData.sections.map((s) => s.title);
  }, [sheetData]);

  // Filter item berdasarkan pencarian & filter kategori
  const filteredSections = useMemo(() => {
    if (!sheetData?.sections) return [];
    const query = searchQuery.trim().toLowerCase();

    return sheetData.sections
      .filter((section) => {
        if (selectedCategory !== 'ALL' && section.title !== selectedCategory) {
          return false;
        }
        return true;
      })
      .map((section) => {
        if (!query) return section;

        const matchedItems = (section.items || []).filter((it) => {
          const matchUraian = String(it.uraian || '').toLowerCase().includes(query);
          const matchKat = String(it.kategori || '').toLowerCase().includes(query);
          const matchAnggaran = String(it.anggaran || '').toLowerCase().includes(query);
          const matchKenyataan = String(it.kenyataan || '').toLowerCase().includes(query);
          const matchJumlah = String(it.jumlah || '').toLowerCase().includes(query);
          return (
            matchUraian ||
            matchKat ||
            matchAnggaran ||
            matchKenyataan ||
            matchJumlah ||
            it.isTotal
          );
        });

        return {
          ...section,
          items: matchedItems,
        };
      })
      .filter((section) => section.items && section.items.length > 0);
  }, [sheetData, searchQuery, selectedCategory]);

  // Hitung total item yang ditampilkan
  const totalItemCount = useMemo(() => {
    return filteredSections.reduce((acc, curr) => acc + (curr.items?.length || 0), 0);
  }, [filteredSections]);

  const handlePrintModal = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  if (!isOpen || !item) return null;

  const isTotalMode = item.bulan === 'TOTAL';
  const displayTitle = isTotalMode
    ? 'Akumulasi Keseluruhan Periode Anggaran'
    : item.bulan;

  // Hitung persentase realisasi
  const persenSerap =
    item.serap !== undefined
      ? item.serap
      : item.subsidi > 0
      ? ((item.pengeluaran / item.subsidi) * 100).toFixed(1)
      : '0';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Overlay backdrop dengan efek blur dan fade in/out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#DCE5E0] overflow-hidden my-auto max-h-[92vh] flex flex-col z-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-keuangan-title"
        >
          {/* Garis aksen emas di bagian atas */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D7A6F] via-[#C6A66B] to-[#1D7A6F]" />

          {/* ============================================================== */}
          {/* 1. HEADER MODAL                                                */}
          {/* ============================================================== */}
          <div className="relative px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 bg-[#FAF6EF]/60 border-b border-[#DCE5E0] shrink-0">
            {/* Tombol Aksi di Sudut Kanan Atas */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 no-print">
              <button
                type="button"
                onClick={handlePrintModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF6EF] text-[#26332E] hover:text-[#1D7A6F] border border-[#DCE5E0] text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                title="Cetak Rincian Keuangan"
              >
                <Printer className="w-3.5 h-3.5 text-[#1D7A6F]" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-[#5C6E66] hover:text-rose-700 border border-[#DCE5E0] transition-colors cursor-pointer"
                aria-label="Tutup rincian keuangan"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-3.5 pr-20 sm:pr-28">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1D7A6F] text-[#C6A66B] flex items-center justify-center shrink-0 border border-[#C6A66B]/30 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1D7A6F] mb-1">
                  <span className="bg-white px-2 py-0.5 rounded border border-[#DCE5E0] font-mono text-[11px] text-[#26332E]">
                    Rincian Keuangan Asli
                  </span>
                  <span>•</span>
                  <span>MMD Darussalamah</span>
                  {sheetData?.docNumber && (
                    <>
                      <span>•</span>
                      <span className="text-[#5C6E66] font-mono text-[11px] truncate">
                        {sheetData.docNumber}
                      </span>
                    </>
                  )}
                </div>

                <h2
                  id="modal-keuangan-title"
                  className="text-lg sm:text-2xl font-bold text-[#26332E] tracking-tight leading-snug font-serif break-words"
                >
                  {displayTitle}
                </h2>
                <p className="text-xs text-[#5C6E66] mt-0.5">
                  Transparansi rincian alokasi anggaran (RAB), belanja nyata (LPJ), kategori dan nominal dari Google Sheets.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. ISI KONTEN MODAL (SCROLLABLE)                               */}
          {/* ============================================================== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-160px)]"
          >
            {/* Bagian 1: Ringkasan 4 Metrik Keuangan Periode */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Plafon RAB */}
                <div className="p-3 rounded-xl bg-white border border-[#DCE5E0] shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#5C6E66]">
                    <span>RAB (Masuk)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-[#1D7A6F]" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#26332E] font-serif mt-1 truncate">
                    {formatRupiah(item.subsidi || 0)}
                  </div>
                  <div className="text-[10px] text-[#5C6E66] mt-0.5">Plafon Anggaran</div>
                </div>

                {/* Realisasi LPJ */}
                <div className="p-3 rounded-xl bg-[#FAF0ED]/50 border border-[#E8BCB0] shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8A2F1B]">
                    <span>LPJ (Realisasi)</span>
                    <TrendingDown className="w-3.5 h-3.5 text-[#8A2F1B]" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#8A2F1B] font-serif mt-1 truncate">
                    {formatRupiah(item.pengeluaran || 0)}
                  </div>
                  <div className="text-[10px] text-[#8A2F1B]/90 mt-0.5">Pengeluaran Nyata</div>
                </div>

                {/* Saldo Kas */}
                <div className="p-3 rounded-xl bg-[#FAF3E6]/50 border border-[#ECD8A5] shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8C6D23]">
                    <span>Saldo Kas</span>
                    <Wallet className="w-3.5 h-3.5 text-[#8C6D23]" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#8C6D23] font-serif mt-1 truncate">
                    {formatRupiah(item.saldo || 0)}
                  </div>
                  <div className="text-[10px] text-[#8C6D23]/90 mt-0.5">Sisa Saldo Kas</div>
                </div>

                {/* Rasio Serap */}
                <div className="p-3 rounded-xl bg-[#E8F5F3]/50 border border-[#C8E3DC] shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#1D7A6F]">
                    <span>Rasio Serap</span>
                    <Percent className="w-3.5 h-3.5 text-[#1D7A6F]" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#1D7A6F] font-serif mt-1 truncate">
                    {persenSerap}%
                  </div>
                  <div className="text-[10px] text-[#1D7A6F]/90 mt-0.5">Persentase Belanja</div>
                </div>
              </div>

              {/* Keterangan Tambahan Periode jika ada */}
              {item.keterangan && (
                <div className="mt-2.5 px-3.5 py-2 rounded-lg bg-[#FAF6EF] border border-[#DCE5E0] text-xs text-[#5C6E66] flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#1D7A6F] shrink-0" />
                  <span>
                    <strong>Keterangan Periode:</strong> {item.keterangan}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Bagian 2: Pemilih Sheet Detail & Pencarian */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1D7A6F]" />
                  <span className="text-xs sm:text-sm font-bold text-[#26332E]">
                    Sheet Rincian Tersedia ({relevantSheets.length}):
                  </span>
                </div>

                {/* Pencarian Cepat */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6E66]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari rincian barang/kegiatan..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] placeholder-[#5C6E66]/60 focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C6E66] hover:text-[#26332E] text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Tombol Tab Sheet */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-print">
                {relevantSheets.map((sheet) => {
                  const isActive = activeSheetUrl === sheet.csvUrl;
                  return (
                    <button
                      key={sheet.id}
                      type="button"
                      onClick={() => {
                        setSelectedSheetUrl(sheet.csvUrl);
                        setSelectedCategory('ALL');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                        isActive
                          ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                          : 'bg-white text-[#26332E] hover:bg-[#FAF6EF] border-[#DCE5E0]'
                      }`}
                    >
                      {sheet.name}
                    </button>
                  );
                })}
              </div>

              {/* Filter Kategori jika lebih dari 1 kategori */}
              {availableCategories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-print">
                  <span className="text-[11px] font-semibold text-[#5C6E66] shrink-0 mr-1">
                    Kategori:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors shrink-0 ${
                      selectedCategory === 'ALL'
                        ? 'bg-[#26332E] text-white'
                        : 'bg-[#F7F5EF] text-[#5C6E66] hover:bg-[#E8F5F3]'
                    }`}
                  >
                    Semua Kategori ({availableCategories.length})
                  </button>
                  {availableCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors shrink-0 border ${
                        selectedCategory === cat
                          ? 'bg-[#1D7A6F] text-white border-[#1D7A6F]'
                          : 'bg-white text-[#26332E] hover:bg-[#FAF6EF] border-[#DCE5E0]'
                      }`}
                    >
                      {cat.replace(/^[A-Z]\.\s+/, '')}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Bagian 3: Konten Tabel Itemized dari Google Sheets */}
            <motion.div variants={itemVariants}>
              {loading ? (
                <div className="bg-white rounded-xl p-12 text-center text-[#5C6E66] border border-[#DCE5E0] shadow-2xs">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1D7A6F] mb-3" />
                  <p className="text-sm font-semibold text-[#26332E]">
                    Menghubungkan ke Google Sheets...
                  </p>
                  <p className="text-xs text-[#5C6E66] mt-1">
                    Mengambil rincian data asli langsung dari sistem cloud.
                  </p>
                </div>
              ) : error ? (
                <div className="bg-rose-50 rounded-xl p-6 text-rose-800 border border-rose-200 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Info className="w-4 h-4 text-rose-600" />
                    <span>Gagal Memuat Rincian Sheet</span>
                  </div>
                  <p className="text-rose-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => loadSheet(activeSheetUrl)}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : filteredSections.length > 0 ? (
                <div className="space-y-4">
                  {/* Judul Dokumen Sheet */}
                  <div className="p-3.5 rounded-xl bg-[#FAF6EF]/60 border border-[#DCE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-[#1D7A6F] font-serif text-sm">
                        {sheetData?.title || 'Rincian Belanja'}
                      </span>
                      {sheetData?.docNumber && (
                        <p className="text-[11px] text-[#5C6E66] font-mono mt-0.5">
                          {sheetData.docNumber}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#5C6E66] shrink-0 font-medium">
                      Menampilkan {totalItemCount} item rincian
                    </span>
                  </div>

                  {/* Per Section / Kategori */}
                  {filteredSections.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-white rounded-xl border border-[#DCE5E0] overflow-hidden shadow-2xs"
                    >
                      <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#DCE5E0] flex items-center justify-between">
                        <h3 className="font-bold text-xs sm:text-sm text-[#1D7A6F] font-serif flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#C6A66B]" />
                          <span>{section.title}</span>
                        </h3>
                        <span className="text-[10px] font-semibold text-[#5C6E66] bg-white px-2 py-0.5 rounded border border-[#DCE5E0]">
                          {section.items?.length || 0} item
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[10px] font-bold text-[#5C6E66] uppercase tracking-wider">
                              <th className="py-2.5 px-3 w-10 text-center">No</th>
                              <th className="py-2.5 px-3">Uraian / Keterangan</th>
                              <th className="py-2.5 px-2 text-center">Jumlah</th>
                              <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                              <th className="py-2.5 px-3 text-right">Plafon RAB</th>
                              <th className="py-2.5 px-3 text-right text-[#8A2F1B]">Realisasi LPJ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DCE5E0]/70">
                            {section.items?.map((it, iIdx) => {
                              const isTotal = it.isTotal;
                              return (
                                <tr
                                  key={iIdx}
                                  className={`transition-colors ${
                                    isTotal
                                      ? 'bg-[#E8F5F3] font-bold text-[#1D7A6F] border-t-2 border-[#1D7A6F]'
                                      : 'hover:bg-[#FAF8F5]/60'
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center text-[#5C6E66] font-mono text-[11px]">
                                    {it.no || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-[#26332E]">
                                    <div className="break-words max-w-sm sm:max-w-md">
                                      {it.uraian}
                                    </div>
                                    {it.kategori &&
                                      it.kategori !== '-' &&
                                      it.kategori !== section.title && (
                                        <span className="inline-block mt-0.5 text-[10px] text-[#5C6E66] bg-stone-100 px-1.5 py-0.2 rounded">
                                          {it.kategori}
                                        </span>
                                      )}
                                  </td>
                                  <td className="py-2.5 px-2 text-center text-[#5C6E66] whitespace-nowrap">
                                    {it.jumlah !== '-' ? it.jumlah : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-[#5C6E66] font-mono whitespace-nowrap">
                                    {it.hargaSatuan !== '-' ? it.hargaSatuan : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-[#26332E] font-mono whitespace-nowrap">
                                    {it.anggaran !== '-' ? it.anggaran : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-[#8A2F1B] font-mono whitespace-nowrap">
                                    {it.kenyataan !== '-' ? it.kenyataan : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center text-[#5C6E66] border border-[#DCE5E0]">
                  <p className="text-sm font-medium">
                    {searchQuery
                      ? `Tidak ada rincian yang cocok dengan kata kunci "${searchQuery}".`
                      : 'Belum ada rincian item belanja yang tercatat pada sheet ini.'}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs text-[#1D7A6F] font-bold hover:underline cursor-pointer"
                    >
                      Reset Kata Kunci Pencarian
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Bagian 4: Catatan Proyeksi Bulan Berikutnya (jika mode TOTAL) */}
            {isTotalMode && catatanBerikutnya.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DCE5E0] space-y-2"
              >
                <h4 className="font-bold text-xs text-[#1D7A6F] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C6A66B]" />
                  <span>Catatan Proyeksi RAB Bulan Berikutnya</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {catatanBerikutnya.map((note, nIdx) => (
                    <div
                      key={nIdx}
                      className="p-2.5 rounded-lg bg-white border border-[#DCE5E0] text-[#26332E]"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ============================================================== */}
          {/* 3. FOOTER MODAL                                                */}
          {/* ============================================================== */}
          <div className="px-4 sm:px-6 py-3.5 bg-[#FAF6EF]/60 border-t border-[#DCE5E0] flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#5C6E66] gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#1D7A6F] shrink-0" />
              <span>Data asli tersinkronisasi langsung dari Google Sheets WAKA III.</span>
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#F7F5EF] text-[#26332E] border border-[#DCE5E0] font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
